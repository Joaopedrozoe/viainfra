import { Request, Response } from 'express';
import { EvolutionWebhook, EvolutionMessage } from '@/types';
import prisma from '@/utils/database';
import logger from '@/utils/logger';
import { v4 as uuidv4 } from 'uuid';

/**
 * Handle WhatsApp webhook from Evolution API
 */
export const handleWhatsAppWebhook = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const webhookData: EvolutionWebhook = req.body;
    const { event, instance, data } = webhookData;

    logger.info(`Received WhatsApp webhook: ${event} for instance ${instance}`, {
      event,
      instance,
      dataKeys: Object.keys(data),
    });

    // Find the channel by instance_id
    const channel = await prisma.channel.findFirst({
      where: {
        instance_id: instance,
        type: 'whatsapp',
      },
    });

    if (!channel) {
      logger.warn(`Channel not found for instance: ${instance}`);
      res.status(404).json({ message: 'Channel not found for this instance' });
      return;
    }

    // Store webhook event for debugging
    await prisma.webhookEvent.create({
      data: {
        channel_id: channel.id,
        event_type: event,
        payload: webhookData,
        processed: false,
      },
    });

    switch (event) {
      case 'messages.upsert':
        await handleIncomingMessages(data.messages || [], channel);
        break;
      
      case 'connection.update':
        await handleConnectionUpdate(data.state, channel);
        break;
      
      case 'presence.update':
        await handlePresenceUpdate(data.presences || [], channel);
        break;
      
      default:
        logger.info(`Unhandled webhook event type: ${event}`);
    }

    res.status(200).json({ success: true, message: 'Webhook processed' });
  } catch (error) {
    logger.error('WhatsApp webhook error:', error);
    res.status(500).json({ message: 'Error processing webhook' });
  }
};

/**
 * Handle incoming messages from WhatsApp
 */
async function handleIncomingMessages(
  messages: EvolutionMessage[],
  channel: any
): Promise<void> {
  for (const message of messages) {
    try {
      // Skip messages sent by the bot (fromMe = true)
      if (message.key.fromMe) {
        continue;
      }

      const phoneNumber = message.key.remoteJid.replace('@s.whatsapp.net', '');
      const content = extractMessageContent(message);
      
      if (!content) {
        logger.warn('Could not extract content from message', { message });
        continue;
      }

      // Find or create contact
      let contact = await prisma.contact.findFirst({
        where: {
          phone: phoneNumber,
          company_id: channel.company_id,
        },
      });

      if (!contact) {
        contact = await prisma.contact.create({
          data: {
            phone: phoneNumber,
            name: message.pushName || undefined,
            company_id: channel.company_id,
            metadata: {
              whatsapp: {
                pushName: message.pushName,
                participant: message.participant,
              },
            },
          },
        });
      }

      // Find or create conversation
      let conversation = await prisma.conversation.findFirst({
        where: {
          contact_id: contact.id,
          channel_id: channel.id,
          status: { in: ['active', 'transferred'] },
        },
      });

      if (!conversation) {
        conversation = await prisma.conversation.create({
          data: {
            contact_id: contact.id,
            channel_id: channel.id,
            company_id: channel.company_id,
            status: 'active',
            metadata: {},
          },
        });
      }

      // Create message
      await prisma.message.create({
        data: {
          conversation_id: conversation.id,
          content,
          message_type: getMessageType(message),
          sender_type: 'contact',
          external_id: message.key.id,
          metadata: {
            whatsapp: {
              messageTimestamp: message.messageTimestamp,
              pushName: message.pushName,
              participant: message.participant,
            },
          },
        },
      });

      // Update conversation last_message_at
      await prisma.conversation.update({
        where: { id: conversation.id },
        data: { last_message_at: new Date() },
      });

      logger.info(`Message processed for contact ${contact.phone} in conversation ${conversation.id}`);

      // TODO: Here you would:
      // 1. Trigger AI agent response if enabled
      // 2. Send real-time notification via WebSocket
      // 3. Check for auto-assignment rules
      // 4. Update metrics

    } catch (error) {
      logger.error('Error processing individual message:', error);
    }
  }
}

/**
 * Handle connection status updates
 */
async function handleConnectionUpdate(
  state: string | undefined,
  channel: any
): Promise<void> {
  if (!state) return;

  let status: 'connected' | 'disconnected' | 'pending' | 'error';

  switch (state) {
    case 'open':
      status = 'connected';
      break;
    case 'close':
    case 'connecting':
      status = 'disconnected';
      break;
    default:
      status = 'pending';
  }

  await prisma.channel.update({
    where: { id: channel.id },
    data: { 
      status,
      updated_at: new Date(),
    },
  });

  logger.info(`Channel ${channel.id} status updated to: ${status}`);
}

/**
 * Handle presence updates (online/offline status)
 */
async function handlePresenceUpdate(
  presences: any[],
  channel: any
): Promise<void> {
  // For now, just log presence updates
  // In a real implementation, you might update contact metadata
  logger.info(`Received ${presences.length} presence updates for channel ${channel.id}`);
}

/**
 * Extract text content from Evolution API message
 */
function extractMessageContent(message: EvolutionMessage): string | null {
  if (message.message.conversation) {
    return message.message.conversation;
  }

  if (message.message.imageMessage?.caption) {
    return message.message.imageMessage.caption;
  }

  if (message.message.documentMessage?.caption) {
    return message.message.documentMessage.caption;
  }

  // For non-text messages, return a placeholder
  if (message.message.imageMessage) {
    return '[Imagem]';
  }

  if (message.message.audioMessage) {
    return '[Áudio]';
  }

  if (message.message.documentMessage) {
    return '[Documento]';
  }

  return null;
}

/**
 * Determine message type from Evolution API message
 */
function getMessageType(message: EvolutionMessage): string {
  if (message.message.conversation) {
    return 'text';
  }

  if (message.message.imageMessage) {
    return 'image';
  }

  if (message.message.audioMessage) {
    return 'audio';
  }

  if (message.message.documentMessage) {
    return 'document';
  }

  return 'text';
}

/**
 * Get QR Code for WhatsApp connection
 */
export const getWhatsAppQRCode = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { instanceId } = req.params;

    // In a real implementation, this would call the Evolution API
    // to get the QR code for the specified instance
    const evolutionApiUrl = process.env.EVOLUTION_API_URL;
    const evolutionApiKey = process.env.EVOLUTION_API_KEY;

    if (!evolutionApiUrl || !evolutionApiKey) {
      res.status(500).json({ message: 'Evolution API not configured' });
      return;
    }

    // TODO: Make actual API call to Evolution API
    // For now, return a mock response
    const qrCodeData = {
      instanceId,
      qrCode: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
      status: 'disconnected',
      message: 'Scan this QR code with WhatsApp to connect',
    };

    res.json(qrCodeData);
  } catch (error) {
    logger.error('Get WhatsApp QR code error:', error);
    res.status(500).json({ message: 'Error getting QR code' });
  }
};

/**
 * Send WhatsApp message via Evolution API
 */
export const sendWhatsAppMessage = async (
  phone: string,
  message: string,
  instanceId: string
): Promise<boolean> => {
  try {
    const evolutionApiUrl = process.env.EVOLUTION_API_URL;
    const evolutionApiKey = process.env.EVOLUTION_API_KEY;

    if (!evolutionApiUrl || !evolutionApiKey) {
      logger.error('Evolution API not configured');
      return false;
    }

    // TODO: Make actual API call to Evolution API
    // For now, just log the attempt
    logger.info(`Sending WhatsApp message to ${phone} via instance ${instanceId}: ${message}`);

    return true;
  } catch (error) {
    logger.error('Error sending WhatsApp message:', error);
    return false;
  }
};
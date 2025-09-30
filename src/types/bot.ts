import { Node, Edge } from '@xyflow/react';

export interface BotVersion {
  id: string;
  name: string;
  version: string;
  status: 'draft' | 'published';
  createdAt: string;
  updatedAt: string;
  flows: {
    nodes: Node[];
    edges: Edge[];
  };
}

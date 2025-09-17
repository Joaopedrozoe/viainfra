
/**
 * Client
**/

import * as runtime from '@prisma/client/runtime/library.js';
import $Types = runtime.Types // general types
import $Public = runtime.Types.Public
import $Utils = runtime.Types.Utils
import $Extensions = runtime.Types.Extensions
import $Result = runtime.Types.Result

export type PrismaPromise<T> = $Public.PrismaPromise<T>


/**
 * Model Company
 * 
 */
export type Company = $Result.DefaultSelection<Prisma.$CompanyPayload>
/**
 * Model User
 * 
 */
export type User = $Result.DefaultSelection<Prisma.$UserPayload>
/**
 * Model Channel
 * 
 */
export type Channel = $Result.DefaultSelection<Prisma.$ChannelPayload>
/**
 * Model Bot
 * 
 */
export type Bot = $Result.DefaultSelection<Prisma.$BotPayload>
/**
 * Model ChannelBot
 * 
 */
export type ChannelBot = $Result.DefaultSelection<Prisma.$ChannelBotPayload>
/**
 * Model Contact
 * 
 */
export type Contact = $Result.DefaultSelection<Prisma.$ContactPayload>
/**
 * Model Conversation
 * 
 */
export type Conversation = $Result.DefaultSelection<Prisma.$ConversationPayload>
/**
 * Model Message
 * 
 */
export type Message = $Result.DefaultSelection<Prisma.$MessagePayload>
/**
 * Model Ticket
 * 
 */
export type Ticket = $Result.DefaultSelection<Prisma.$TicketPayload>
/**
 * Model WebhookEvent
 * 
 */
export type WebhookEvent = $Result.DefaultSelection<Prisma.$WebhookEventPayload>

/**
 * ##  Prisma Client ʲˢ
 * 
 * Type-safe database client for TypeScript & Node.js
 * @example
 * ```
 * const prisma = new PrismaClient()
 * // Fetch zero or more Companies
 * const companies = await prisma.company.findMany()
 * ```
 *
 * 
 * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client).
 */
export class PrismaClient<
  ClientOptions extends Prisma.PrismaClientOptions = Prisma.PrismaClientOptions,
  U = 'log' extends keyof ClientOptions ? ClientOptions['log'] extends Array<Prisma.LogLevel | Prisma.LogDefinition> ? Prisma.GetEvents<ClientOptions['log']> : never : never,
  ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs
> {
  [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['other'] }

    /**
   * ##  Prisma Client ʲˢ
   * 
   * Type-safe database client for TypeScript & Node.js
   * @example
   * ```
   * const prisma = new PrismaClient()
   * // Fetch zero or more Companies
   * const companies = await prisma.company.findMany()
   * ```
   *
   * 
   * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client).
   */

  constructor(optionsArg ?: Prisma.Subset<ClientOptions, Prisma.PrismaClientOptions>);
  $on<V extends U>(eventType: V, callback: (event: V extends 'query' ? Prisma.QueryEvent : Prisma.LogEvent) => void): void;

  /**
   * Connect with the database
   */
  $connect(): $Utils.JsPromise<void>;

  /**
   * Disconnect from the database
   */
  $disconnect(): $Utils.JsPromise<void>;

  /**
   * Add a middleware
   * @deprecated since 4.16.0. For new code, prefer client extensions instead.
   * @see https://pris.ly/d/extensions
   */
  $use(cb: Prisma.Middleware): void

/**
   * Executes a prepared raw query and returns the number of affected rows.
   * @example
   * ```
   * const result = await prisma.$executeRaw`UPDATE User SET cool = ${true} WHERE email = ${'user@email.com'};`
   * ```
   * 
   * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client/raw-database-access).
   */
  $executeRaw<T = unknown>(query: TemplateStringsArray | Prisma.Sql, ...values: any[]): Prisma.PrismaPromise<number>;

  /**
   * Executes a raw query and returns the number of affected rows.
   * Susceptible to SQL injections, see documentation.
   * @example
   * ```
   * const result = await prisma.$executeRawUnsafe('UPDATE User SET cool = $1 WHERE email = $2 ;', true, 'user@email.com')
   * ```
   * 
   * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client/raw-database-access).
   */
  $executeRawUnsafe<T = unknown>(query: string, ...values: any[]): Prisma.PrismaPromise<number>;

  /**
   * Performs a prepared raw query and returns the `SELECT` data.
   * @example
   * ```
   * const result = await prisma.$queryRaw`SELECT * FROM User WHERE id = ${1} OR email = ${'user@email.com'};`
   * ```
   * 
   * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client/raw-database-access).
   */
  $queryRaw<T = unknown>(query: TemplateStringsArray | Prisma.Sql, ...values: any[]): Prisma.PrismaPromise<T>;

  /**
   * Performs a raw query and returns the `SELECT` data.
   * Susceptible to SQL injections, see documentation.
   * @example
   * ```
   * const result = await prisma.$queryRawUnsafe('SELECT * FROM User WHERE id = $1 OR email = $2;', 1, 'user@email.com')
   * ```
   * 
   * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client/raw-database-access).
   */
  $queryRawUnsafe<T = unknown>(query: string, ...values: any[]): Prisma.PrismaPromise<T>;


  /**
   * Allows the running of a sequence of read/write operations that are guaranteed to either succeed or fail as a whole.
   * @example
   * ```
   * const [george, bob, alice] = await prisma.$transaction([
   *   prisma.user.create({ data: { name: 'George' } }),
   *   prisma.user.create({ data: { name: 'Bob' } }),
   *   prisma.user.create({ data: { name: 'Alice' } }),
   * ])
   * ```
   * 
   * Read more in our [docs](https://www.prisma.io/docs/concepts/components/prisma-client/transactions).
   */
  $transaction<P extends Prisma.PrismaPromise<any>[]>(arg: [...P], options?: { isolationLevel?: Prisma.TransactionIsolationLevel }): $Utils.JsPromise<runtime.Types.Utils.UnwrapTuple<P>>

  $transaction<R>(fn: (prisma: Omit<PrismaClient, runtime.ITXClientDenyList>) => $Utils.JsPromise<R>, options?: { maxWait?: number, timeout?: number, isolationLevel?: Prisma.TransactionIsolationLevel }): $Utils.JsPromise<R>


  $extends: $Extensions.ExtendsHook<"extends", Prisma.TypeMapCb, ExtArgs>

      /**
   * `prisma.company`: Exposes CRUD operations for the **Company** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more Companies
    * const companies = await prisma.company.findMany()
    * ```
    */
  get company(): Prisma.CompanyDelegate<ExtArgs>;

  /**
   * `prisma.user`: Exposes CRUD operations for the **User** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more Users
    * const users = await prisma.user.findMany()
    * ```
    */
  get user(): Prisma.UserDelegate<ExtArgs>;

  /**
   * `prisma.channel`: Exposes CRUD operations for the **Channel** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more Channels
    * const channels = await prisma.channel.findMany()
    * ```
    */
  get channel(): Prisma.ChannelDelegate<ExtArgs>;

  /**
   * `prisma.bot`: Exposes CRUD operations for the **Bot** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more Bots
    * const bots = await prisma.bot.findMany()
    * ```
    */
  get bot(): Prisma.BotDelegate<ExtArgs>;

  /**
   * `prisma.channelBot`: Exposes CRUD operations for the **ChannelBot** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more ChannelBots
    * const channelBots = await prisma.channelBot.findMany()
    * ```
    */
  get channelBot(): Prisma.ChannelBotDelegate<ExtArgs>;

  /**
   * `prisma.contact`: Exposes CRUD operations for the **Contact** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more Contacts
    * const contacts = await prisma.contact.findMany()
    * ```
    */
  get contact(): Prisma.ContactDelegate<ExtArgs>;

  /**
   * `prisma.conversation`: Exposes CRUD operations for the **Conversation** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more Conversations
    * const conversations = await prisma.conversation.findMany()
    * ```
    */
  get conversation(): Prisma.ConversationDelegate<ExtArgs>;

  /**
   * `prisma.message`: Exposes CRUD operations for the **Message** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more Messages
    * const messages = await prisma.message.findMany()
    * ```
    */
  get message(): Prisma.MessageDelegate<ExtArgs>;

  /**
   * `prisma.ticket`: Exposes CRUD operations for the **Ticket** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more Tickets
    * const tickets = await prisma.ticket.findMany()
    * ```
    */
  get ticket(): Prisma.TicketDelegate<ExtArgs>;

  /**
   * `prisma.webhookEvent`: Exposes CRUD operations for the **WebhookEvent** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more WebhookEvents
    * const webhookEvents = await prisma.webhookEvent.findMany()
    * ```
    */
  get webhookEvent(): Prisma.WebhookEventDelegate<ExtArgs>;
}

export namespace Prisma {
  export import DMMF = runtime.DMMF

  export type PrismaPromise<T> = $Public.PrismaPromise<T>

  /**
   * Validator
   */
  export import validator = runtime.Public.validator

  /**
   * Prisma Errors
   */
  export import PrismaClientKnownRequestError = runtime.PrismaClientKnownRequestError
  export import PrismaClientUnknownRequestError = runtime.PrismaClientUnknownRequestError
  export import PrismaClientRustPanicError = runtime.PrismaClientRustPanicError
  export import PrismaClientInitializationError = runtime.PrismaClientInitializationError
  export import PrismaClientValidationError = runtime.PrismaClientValidationError
  export import NotFoundError = runtime.NotFoundError

  /**
   * Re-export of sql-template-tag
   */
  export import sql = runtime.sqltag
  export import empty = runtime.empty
  export import join = runtime.join
  export import raw = runtime.raw
  export import Sql = runtime.Sql



  /**
   * Decimal.js
   */
  export import Decimal = runtime.Decimal

  export type DecimalJsLike = runtime.DecimalJsLike

  /**
   * Metrics 
   */
  export type Metrics = runtime.Metrics
  export type Metric<T> = runtime.Metric<T>
  export type MetricHistogram = runtime.MetricHistogram
  export type MetricHistogramBucket = runtime.MetricHistogramBucket

  /**
  * Extensions
  */
  export import Extension = $Extensions.UserArgs
  export import getExtensionContext = runtime.Extensions.getExtensionContext
  export import Args = $Public.Args
  export import Payload = $Public.Payload
  export import Result = $Public.Result
  export import Exact = $Public.Exact

  /**
   * Prisma Client JS version: 5.22.0
   * Query Engine version: 605197351a3c8bdd595af2d2a9bc3025bca48ea2
   */
  export type PrismaVersion = {
    client: string
  }

  export const prismaVersion: PrismaVersion 

  /**
   * Utility Types
   */


  export import JsonObject = runtime.JsonObject
  export import JsonArray = runtime.JsonArray
  export import JsonValue = runtime.JsonValue
  export import InputJsonObject = runtime.InputJsonObject
  export import InputJsonArray = runtime.InputJsonArray
  export import InputJsonValue = runtime.InputJsonValue

  /**
   * Types of the values used to represent different kinds of `null` values when working with JSON fields.
   * 
   * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
   */
  namespace NullTypes {
    /**
    * Type of `Prisma.DbNull`.
    * 
    * You cannot use other instances of this class. Please use the `Prisma.DbNull` value.
    * 
    * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
    */
    class DbNull {
      private DbNull: never
      private constructor()
    }

    /**
    * Type of `Prisma.JsonNull`.
    * 
    * You cannot use other instances of this class. Please use the `Prisma.JsonNull` value.
    * 
    * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
    */
    class JsonNull {
      private JsonNull: never
      private constructor()
    }

    /**
    * Type of `Prisma.AnyNull`.
    * 
    * You cannot use other instances of this class. Please use the `Prisma.AnyNull` value.
    * 
    * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
    */
    class AnyNull {
      private AnyNull: never
      private constructor()
    }
  }

  /**
   * Helper for filtering JSON entries that have `null` on the database (empty on the db)
   * 
   * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
   */
  export const DbNull: NullTypes.DbNull

  /**
   * Helper for filtering JSON entries that have JSON `null` values (not empty on the db)
   * 
   * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
   */
  export const JsonNull: NullTypes.JsonNull

  /**
   * Helper for filtering JSON entries that are `Prisma.DbNull` or `Prisma.JsonNull`
   * 
   * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
   */
  export const AnyNull: NullTypes.AnyNull

  type SelectAndInclude = {
    select: any
    include: any
  }

  type SelectAndOmit = {
    select: any
    omit: any
  }

  /**
   * Get the type of the value, that the Promise holds.
   */
  export type PromiseType<T extends PromiseLike<any>> = T extends PromiseLike<infer U> ? U : T;

  /**
   * Get the return type of a function which returns a Promise.
   */
  export type PromiseReturnType<T extends (...args: any) => $Utils.JsPromise<any>> = PromiseType<ReturnType<T>>

  /**
   * From T, pick a set of properties whose keys are in the union K
   */
  type Prisma__Pick<T, K extends keyof T> = {
      [P in K]: T[P];
  };


  export type Enumerable<T> = T | Array<T>;

  export type RequiredKeys<T> = {
    [K in keyof T]-?: {} extends Prisma__Pick<T, K> ? never : K
  }[keyof T]

  export type TruthyKeys<T> = keyof {
    [K in keyof T as T[K] extends false | undefined | null ? never : K]: K
  }

  export type TrueKeys<T> = TruthyKeys<Prisma__Pick<T, RequiredKeys<T>>>

  /**
   * Subset
   * @desc From `T` pick properties that exist in `U`. Simple version of Intersection
   */
  export type Subset<T, U> = {
    [key in keyof T]: key extends keyof U ? T[key] : never;
  };

  /**
   * SelectSubset
   * @desc From `T` pick properties that exist in `U`. Simple version of Intersection.
   * Additionally, it validates, if both select and include are present. If the case, it errors.
   */
  export type SelectSubset<T, U> = {
    [key in keyof T]: key extends keyof U ? T[key] : never
  } &
    (T extends SelectAndInclude
      ? 'Please either choose `select` or `include`.'
      : T extends SelectAndOmit
        ? 'Please either choose `select` or `omit`.'
        : {})

  /**
   * Subset + Intersection
   * @desc From `T` pick properties that exist in `U` and intersect `K`
   */
  export type SubsetIntersection<T, U, K> = {
    [key in keyof T]: key extends keyof U ? T[key] : never
  } &
    K

  type Without<T, U> = { [P in Exclude<keyof T, keyof U>]?: never };

  /**
   * XOR is needed to have a real mutually exclusive union type
   * https://stackoverflow.com/questions/42123407/does-typescript-support-mutually-exclusive-types
   */
  type XOR<T, U> =
    T extends object ?
    U extends object ?
      (Without<T, U> & U) | (Without<U, T> & T)
    : U : T


  /**
   * Is T a Record?
   */
  type IsObject<T extends any> = T extends Array<any>
  ? False
  : T extends Date
  ? False
  : T extends Uint8Array
  ? False
  : T extends BigInt
  ? False
  : T extends object
  ? True
  : False


  /**
   * If it's T[], return T
   */
  export type UnEnumerate<T extends unknown> = T extends Array<infer U> ? U : T

  /**
   * From ts-toolbelt
   */

  type __Either<O extends object, K extends Key> = Omit<O, K> &
    {
      // Merge all but K
      [P in K]: Prisma__Pick<O, P & keyof O> // With K possibilities
    }[K]

  type EitherStrict<O extends object, K extends Key> = Strict<__Either<O, K>>

  type EitherLoose<O extends object, K extends Key> = ComputeRaw<__Either<O, K>>

  type _Either<
    O extends object,
    K extends Key,
    strict extends Boolean
  > = {
    1: EitherStrict<O, K>
    0: EitherLoose<O, K>
  }[strict]

  type Either<
    O extends object,
    K extends Key,
    strict extends Boolean = 1
  > = O extends unknown ? _Either<O, K, strict> : never

  export type Union = any

  type PatchUndefined<O extends object, O1 extends object> = {
    [K in keyof O]: O[K] extends undefined ? At<O1, K> : O[K]
  } & {}

  /** Helper Types for "Merge" **/
  export type IntersectOf<U extends Union> = (
    U extends unknown ? (k: U) => void : never
  ) extends (k: infer I) => void
    ? I
    : never

  export type Overwrite<O extends object, O1 extends object> = {
      [K in keyof O]: K extends keyof O1 ? O1[K] : O[K];
  } & {};

  type _Merge<U extends object> = IntersectOf<Overwrite<U, {
      [K in keyof U]-?: At<U, K>;
  }>>;

  type Key = string | number | symbol;
  type AtBasic<O extends object, K extends Key> = K extends keyof O ? O[K] : never;
  type AtStrict<O extends object, K extends Key> = O[K & keyof O];
  type AtLoose<O extends object, K extends Key> = O extends unknown ? AtStrict<O, K> : never;
  export type At<O extends object, K extends Key, strict extends Boolean = 1> = {
      1: AtStrict<O, K>;
      0: AtLoose<O, K>;
  }[strict];

  export type ComputeRaw<A extends any> = A extends Function ? A : {
    [K in keyof A]: A[K];
  } & {};

  export type OptionalFlat<O> = {
    [K in keyof O]?: O[K];
  } & {};

  type _Record<K extends keyof any, T> = {
    [P in K]: T;
  };

  // cause typescript not to expand types and preserve names
  type NoExpand<T> = T extends unknown ? T : never;

  // this type assumes the passed object is entirely optional
  type AtLeast<O extends object, K extends string> = NoExpand<
    O extends unknown
    ? | (K extends keyof O ? { [P in K]: O[P] } & O : O)
      | {[P in keyof O as P extends K ? K : never]-?: O[P]} & O
    : never>;

  type _Strict<U, _U = U> = U extends unknown ? U & OptionalFlat<_Record<Exclude<Keys<_U>, keyof U>, never>> : never;

  export type Strict<U extends object> = ComputeRaw<_Strict<U>>;
  /** End Helper Types for "Merge" **/

  export type Merge<U extends object> = ComputeRaw<_Merge<Strict<U>>>;

  /**
  A [[Boolean]]
  */
  export type Boolean = True | False

  // /**
  // 1
  // */
  export type True = 1

  /**
  0
  */
  export type False = 0

  export type Not<B extends Boolean> = {
    0: 1
    1: 0
  }[B]

  export type Extends<A1 extends any, A2 extends any> = [A1] extends [never]
    ? 0 // anything `never` is false
    : A1 extends A2
    ? 1
    : 0

  export type Has<U extends Union, U1 extends Union> = Not<
    Extends<Exclude<U1, U>, U1>
  >

  export type Or<B1 extends Boolean, B2 extends Boolean> = {
    0: {
      0: 0
      1: 1
    }
    1: {
      0: 1
      1: 1
    }
  }[B1][B2]

  export type Keys<U extends Union> = U extends unknown ? keyof U : never

  type Cast<A, B> = A extends B ? A : B;

  export const type: unique symbol;



  /**
   * Used by group by
   */

  export type GetScalarType<T, O> = O extends object ? {
    [P in keyof T]: P extends keyof O
      ? O[P]
      : never
  } : never

  type FieldPaths<
    T,
    U = Omit<T, '_avg' | '_sum' | '_count' | '_min' | '_max'>
  > = IsObject<T> extends True ? U : T

  type GetHavingFields<T> = {
    [K in keyof T]: Or<
      Or<Extends<'OR', K>, Extends<'AND', K>>,
      Extends<'NOT', K>
    > extends True
      ? // infer is only needed to not hit TS limit
        // based on the brilliant idea of Pierre-Antoine Mills
        // https://github.com/microsoft/TypeScript/issues/30188#issuecomment-478938437
        T[K] extends infer TK
        ? GetHavingFields<UnEnumerate<TK> extends object ? Merge<UnEnumerate<TK>> : never>
        : never
      : {} extends FieldPaths<T[K]>
      ? never
      : K
  }[keyof T]

  /**
   * Convert tuple to union
   */
  type _TupleToUnion<T> = T extends (infer E)[] ? E : never
  type TupleToUnion<K extends readonly any[]> = _TupleToUnion<K>
  type MaybeTupleToUnion<T> = T extends any[] ? TupleToUnion<T> : T

  /**
   * Like `Pick`, but additionally can also accept an array of keys
   */
  type PickEnumerable<T, K extends Enumerable<keyof T> | keyof T> = Prisma__Pick<T, MaybeTupleToUnion<K>>

  /**
   * Exclude all keys with underscores
   */
  type ExcludeUnderscoreKeys<T extends string> = T extends `_${string}` ? never : T


  export type FieldRef<Model, FieldType> = runtime.FieldRef<Model, FieldType>

  type FieldRefInputType<Model, FieldType> = Model extends never ? never : FieldRef<Model, FieldType>


  export const ModelName: {
    Company: 'Company',
    User: 'User',
    Channel: 'Channel',
    Bot: 'Bot',
    ChannelBot: 'ChannelBot',
    Contact: 'Contact',
    Conversation: 'Conversation',
    Message: 'Message',
    Ticket: 'Ticket',
    WebhookEvent: 'WebhookEvent'
  };

  export type ModelName = (typeof ModelName)[keyof typeof ModelName]


  export type Datasources = {
    db?: Datasource
  }

  interface TypeMapCb extends $Utils.Fn<{extArgs: $Extensions.InternalArgs, clientOptions: PrismaClientOptions }, $Utils.Record<string, any>> {
    returns: Prisma.TypeMap<this['params']['extArgs'], this['params']['clientOptions']>
  }

  export type TypeMap<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, ClientOptions = {}> = {
    meta: {
      modelProps: "company" | "user" | "channel" | "bot" | "channelBot" | "contact" | "conversation" | "message" | "ticket" | "webhookEvent"
      txIsolationLevel: Prisma.TransactionIsolationLevel
    }
    model: {
      Company: {
        payload: Prisma.$CompanyPayload<ExtArgs>
        fields: Prisma.CompanyFieldRefs
        operations: {
          findUnique: {
            args: Prisma.CompanyFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CompanyPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.CompanyFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CompanyPayload>
          }
          findFirst: {
            args: Prisma.CompanyFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CompanyPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.CompanyFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CompanyPayload>
          }
          findMany: {
            args: Prisma.CompanyFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CompanyPayload>[]
          }
          create: {
            args: Prisma.CompanyCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CompanyPayload>
          }
          createMany: {
            args: Prisma.CompanyCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.CompanyCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CompanyPayload>[]
          }
          delete: {
            args: Prisma.CompanyDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CompanyPayload>
          }
          update: {
            args: Prisma.CompanyUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CompanyPayload>
          }
          deleteMany: {
            args: Prisma.CompanyDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.CompanyUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          upsert: {
            args: Prisma.CompanyUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CompanyPayload>
          }
          aggregate: {
            args: Prisma.CompanyAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateCompany>
          }
          groupBy: {
            args: Prisma.CompanyGroupByArgs<ExtArgs>
            result: $Utils.Optional<CompanyGroupByOutputType>[]
          }
          count: {
            args: Prisma.CompanyCountArgs<ExtArgs>
            result: $Utils.Optional<CompanyCountAggregateOutputType> | number
          }
        }
      }
      User: {
        payload: Prisma.$UserPayload<ExtArgs>
        fields: Prisma.UserFieldRefs
        operations: {
          findUnique: {
            args: Prisma.UserFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$UserPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.UserFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$UserPayload>
          }
          findFirst: {
            args: Prisma.UserFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$UserPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.UserFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$UserPayload>
          }
          findMany: {
            args: Prisma.UserFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$UserPayload>[]
          }
          create: {
            args: Prisma.UserCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$UserPayload>
          }
          createMany: {
            args: Prisma.UserCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.UserCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$UserPayload>[]
          }
          delete: {
            args: Prisma.UserDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$UserPayload>
          }
          update: {
            args: Prisma.UserUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$UserPayload>
          }
          deleteMany: {
            args: Prisma.UserDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.UserUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          upsert: {
            args: Prisma.UserUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$UserPayload>
          }
          aggregate: {
            args: Prisma.UserAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateUser>
          }
          groupBy: {
            args: Prisma.UserGroupByArgs<ExtArgs>
            result: $Utils.Optional<UserGroupByOutputType>[]
          }
          count: {
            args: Prisma.UserCountArgs<ExtArgs>
            result: $Utils.Optional<UserCountAggregateOutputType> | number
          }
        }
      }
      Channel: {
        payload: Prisma.$ChannelPayload<ExtArgs>
        fields: Prisma.ChannelFieldRefs
        operations: {
          findUnique: {
            args: Prisma.ChannelFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ChannelPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.ChannelFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ChannelPayload>
          }
          findFirst: {
            args: Prisma.ChannelFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ChannelPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.ChannelFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ChannelPayload>
          }
          findMany: {
            args: Prisma.ChannelFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ChannelPayload>[]
          }
          create: {
            args: Prisma.ChannelCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ChannelPayload>
          }
          createMany: {
            args: Prisma.ChannelCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.ChannelCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ChannelPayload>[]
          }
          delete: {
            args: Prisma.ChannelDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ChannelPayload>
          }
          update: {
            args: Prisma.ChannelUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ChannelPayload>
          }
          deleteMany: {
            args: Prisma.ChannelDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.ChannelUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          upsert: {
            args: Prisma.ChannelUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ChannelPayload>
          }
          aggregate: {
            args: Prisma.ChannelAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateChannel>
          }
          groupBy: {
            args: Prisma.ChannelGroupByArgs<ExtArgs>
            result: $Utils.Optional<ChannelGroupByOutputType>[]
          }
          count: {
            args: Prisma.ChannelCountArgs<ExtArgs>
            result: $Utils.Optional<ChannelCountAggregateOutputType> | number
          }
        }
      }
      Bot: {
        payload: Prisma.$BotPayload<ExtArgs>
        fields: Prisma.BotFieldRefs
        operations: {
          findUnique: {
            args: Prisma.BotFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$BotPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.BotFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$BotPayload>
          }
          findFirst: {
            args: Prisma.BotFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$BotPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.BotFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$BotPayload>
          }
          findMany: {
            args: Prisma.BotFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$BotPayload>[]
          }
          create: {
            args: Prisma.BotCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$BotPayload>
          }
          createMany: {
            args: Prisma.BotCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.BotCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$BotPayload>[]
          }
          delete: {
            args: Prisma.BotDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$BotPayload>
          }
          update: {
            args: Prisma.BotUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$BotPayload>
          }
          deleteMany: {
            args: Prisma.BotDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.BotUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          upsert: {
            args: Prisma.BotUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$BotPayload>
          }
          aggregate: {
            args: Prisma.BotAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateBot>
          }
          groupBy: {
            args: Prisma.BotGroupByArgs<ExtArgs>
            result: $Utils.Optional<BotGroupByOutputType>[]
          }
          count: {
            args: Prisma.BotCountArgs<ExtArgs>
            result: $Utils.Optional<BotCountAggregateOutputType> | number
          }
        }
      }
      ChannelBot: {
        payload: Prisma.$ChannelBotPayload<ExtArgs>
        fields: Prisma.ChannelBotFieldRefs
        operations: {
          findUnique: {
            args: Prisma.ChannelBotFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ChannelBotPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.ChannelBotFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ChannelBotPayload>
          }
          findFirst: {
            args: Prisma.ChannelBotFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ChannelBotPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.ChannelBotFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ChannelBotPayload>
          }
          findMany: {
            args: Prisma.ChannelBotFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ChannelBotPayload>[]
          }
          create: {
            args: Prisma.ChannelBotCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ChannelBotPayload>
          }
          createMany: {
            args: Prisma.ChannelBotCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.ChannelBotCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ChannelBotPayload>[]
          }
          delete: {
            args: Prisma.ChannelBotDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ChannelBotPayload>
          }
          update: {
            args: Prisma.ChannelBotUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ChannelBotPayload>
          }
          deleteMany: {
            args: Prisma.ChannelBotDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.ChannelBotUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          upsert: {
            args: Prisma.ChannelBotUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ChannelBotPayload>
          }
          aggregate: {
            args: Prisma.ChannelBotAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateChannelBot>
          }
          groupBy: {
            args: Prisma.ChannelBotGroupByArgs<ExtArgs>
            result: $Utils.Optional<ChannelBotGroupByOutputType>[]
          }
          count: {
            args: Prisma.ChannelBotCountArgs<ExtArgs>
            result: $Utils.Optional<ChannelBotCountAggregateOutputType> | number
          }
        }
      }
      Contact: {
        payload: Prisma.$ContactPayload<ExtArgs>
        fields: Prisma.ContactFieldRefs
        operations: {
          findUnique: {
            args: Prisma.ContactFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ContactPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.ContactFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ContactPayload>
          }
          findFirst: {
            args: Prisma.ContactFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ContactPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.ContactFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ContactPayload>
          }
          findMany: {
            args: Prisma.ContactFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ContactPayload>[]
          }
          create: {
            args: Prisma.ContactCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ContactPayload>
          }
          createMany: {
            args: Prisma.ContactCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.ContactCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ContactPayload>[]
          }
          delete: {
            args: Prisma.ContactDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ContactPayload>
          }
          update: {
            args: Prisma.ContactUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ContactPayload>
          }
          deleteMany: {
            args: Prisma.ContactDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.ContactUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          upsert: {
            args: Prisma.ContactUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ContactPayload>
          }
          aggregate: {
            args: Prisma.ContactAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateContact>
          }
          groupBy: {
            args: Prisma.ContactGroupByArgs<ExtArgs>
            result: $Utils.Optional<ContactGroupByOutputType>[]
          }
          count: {
            args: Prisma.ContactCountArgs<ExtArgs>
            result: $Utils.Optional<ContactCountAggregateOutputType> | number
          }
        }
      }
      Conversation: {
        payload: Prisma.$ConversationPayload<ExtArgs>
        fields: Prisma.ConversationFieldRefs
        operations: {
          findUnique: {
            args: Prisma.ConversationFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ConversationPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.ConversationFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ConversationPayload>
          }
          findFirst: {
            args: Prisma.ConversationFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ConversationPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.ConversationFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ConversationPayload>
          }
          findMany: {
            args: Prisma.ConversationFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ConversationPayload>[]
          }
          create: {
            args: Prisma.ConversationCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ConversationPayload>
          }
          createMany: {
            args: Prisma.ConversationCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.ConversationCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ConversationPayload>[]
          }
          delete: {
            args: Prisma.ConversationDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ConversationPayload>
          }
          update: {
            args: Prisma.ConversationUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ConversationPayload>
          }
          deleteMany: {
            args: Prisma.ConversationDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.ConversationUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          upsert: {
            args: Prisma.ConversationUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ConversationPayload>
          }
          aggregate: {
            args: Prisma.ConversationAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateConversation>
          }
          groupBy: {
            args: Prisma.ConversationGroupByArgs<ExtArgs>
            result: $Utils.Optional<ConversationGroupByOutputType>[]
          }
          count: {
            args: Prisma.ConversationCountArgs<ExtArgs>
            result: $Utils.Optional<ConversationCountAggregateOutputType> | number
          }
        }
      }
      Message: {
        payload: Prisma.$MessagePayload<ExtArgs>
        fields: Prisma.MessageFieldRefs
        operations: {
          findUnique: {
            args: Prisma.MessageFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$MessagePayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.MessageFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$MessagePayload>
          }
          findFirst: {
            args: Prisma.MessageFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$MessagePayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.MessageFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$MessagePayload>
          }
          findMany: {
            args: Prisma.MessageFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$MessagePayload>[]
          }
          create: {
            args: Prisma.MessageCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$MessagePayload>
          }
          createMany: {
            args: Prisma.MessageCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.MessageCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$MessagePayload>[]
          }
          delete: {
            args: Prisma.MessageDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$MessagePayload>
          }
          update: {
            args: Prisma.MessageUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$MessagePayload>
          }
          deleteMany: {
            args: Prisma.MessageDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.MessageUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          upsert: {
            args: Prisma.MessageUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$MessagePayload>
          }
          aggregate: {
            args: Prisma.MessageAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateMessage>
          }
          groupBy: {
            args: Prisma.MessageGroupByArgs<ExtArgs>
            result: $Utils.Optional<MessageGroupByOutputType>[]
          }
          count: {
            args: Prisma.MessageCountArgs<ExtArgs>
            result: $Utils.Optional<MessageCountAggregateOutputType> | number
          }
        }
      }
      Ticket: {
        payload: Prisma.$TicketPayload<ExtArgs>
        fields: Prisma.TicketFieldRefs
        operations: {
          findUnique: {
            args: Prisma.TicketFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TicketPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.TicketFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TicketPayload>
          }
          findFirst: {
            args: Prisma.TicketFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TicketPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.TicketFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TicketPayload>
          }
          findMany: {
            args: Prisma.TicketFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TicketPayload>[]
          }
          create: {
            args: Prisma.TicketCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TicketPayload>
          }
          createMany: {
            args: Prisma.TicketCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.TicketCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TicketPayload>[]
          }
          delete: {
            args: Prisma.TicketDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TicketPayload>
          }
          update: {
            args: Prisma.TicketUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TicketPayload>
          }
          deleteMany: {
            args: Prisma.TicketDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.TicketUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          upsert: {
            args: Prisma.TicketUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TicketPayload>
          }
          aggregate: {
            args: Prisma.TicketAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateTicket>
          }
          groupBy: {
            args: Prisma.TicketGroupByArgs<ExtArgs>
            result: $Utils.Optional<TicketGroupByOutputType>[]
          }
          count: {
            args: Prisma.TicketCountArgs<ExtArgs>
            result: $Utils.Optional<TicketCountAggregateOutputType> | number
          }
        }
      }
      WebhookEvent: {
        payload: Prisma.$WebhookEventPayload<ExtArgs>
        fields: Prisma.WebhookEventFieldRefs
        operations: {
          findUnique: {
            args: Prisma.WebhookEventFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$WebhookEventPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.WebhookEventFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$WebhookEventPayload>
          }
          findFirst: {
            args: Prisma.WebhookEventFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$WebhookEventPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.WebhookEventFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$WebhookEventPayload>
          }
          findMany: {
            args: Prisma.WebhookEventFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$WebhookEventPayload>[]
          }
          create: {
            args: Prisma.WebhookEventCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$WebhookEventPayload>
          }
          createMany: {
            args: Prisma.WebhookEventCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.WebhookEventCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$WebhookEventPayload>[]
          }
          delete: {
            args: Prisma.WebhookEventDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$WebhookEventPayload>
          }
          update: {
            args: Prisma.WebhookEventUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$WebhookEventPayload>
          }
          deleteMany: {
            args: Prisma.WebhookEventDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.WebhookEventUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          upsert: {
            args: Prisma.WebhookEventUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$WebhookEventPayload>
          }
          aggregate: {
            args: Prisma.WebhookEventAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateWebhookEvent>
          }
          groupBy: {
            args: Prisma.WebhookEventGroupByArgs<ExtArgs>
            result: $Utils.Optional<WebhookEventGroupByOutputType>[]
          }
          count: {
            args: Prisma.WebhookEventCountArgs<ExtArgs>
            result: $Utils.Optional<WebhookEventCountAggregateOutputType> | number
          }
        }
      }
    }
  } & {
    other: {
      payload: any
      operations: {
        $executeRaw: {
          args: [query: TemplateStringsArray | Prisma.Sql, ...values: any[]],
          result: any
        }
        $executeRawUnsafe: {
          args: [query: string, ...values: any[]],
          result: any
        }
        $queryRaw: {
          args: [query: TemplateStringsArray | Prisma.Sql, ...values: any[]],
          result: any
        }
        $queryRawUnsafe: {
          args: [query: string, ...values: any[]],
          result: any
        }
      }
    }
  }
  export const defineExtension: $Extensions.ExtendsHook<"define", Prisma.TypeMapCb, $Extensions.DefaultArgs>
  export type DefaultPrismaClient = PrismaClient
  export type ErrorFormat = 'pretty' | 'colorless' | 'minimal'
  export interface PrismaClientOptions {
    /**
     * Overwrites the datasource url from your schema.prisma file
     */
    datasources?: Datasources
    /**
     * Overwrites the datasource url from your schema.prisma file
     */
    datasourceUrl?: string
    /**
     * @default "colorless"
     */
    errorFormat?: ErrorFormat
    /**
     * @example
     * ```
     * // Defaults to stdout
     * log: ['query', 'info', 'warn', 'error']
     * 
     * // Emit as events
     * log: [
     *   { emit: 'stdout', level: 'query' },
     *   { emit: 'stdout', level: 'info' },
     *   { emit: 'stdout', level: 'warn' }
     *   { emit: 'stdout', level: 'error' }
     * ]
     * ```
     * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client/logging#the-log-option).
     */
    log?: (LogLevel | LogDefinition)[]
    /**
     * The default values for transactionOptions
     * maxWait ?= 2000
     * timeout ?= 5000
     */
    transactionOptions?: {
      maxWait?: number
      timeout?: number
      isolationLevel?: Prisma.TransactionIsolationLevel
    }
  }


  /* Types for Logging */
  export type LogLevel = 'info' | 'query' | 'warn' | 'error'
  export type LogDefinition = {
    level: LogLevel
    emit: 'stdout' | 'event'
  }

  export type GetLogType<T extends LogLevel | LogDefinition> = T extends LogDefinition ? T['emit'] extends 'event' ? T['level'] : never : never
  export type GetEvents<T extends any> = T extends Array<LogLevel | LogDefinition> ?
    GetLogType<T[0]> | GetLogType<T[1]> | GetLogType<T[2]> | GetLogType<T[3]>
    : never

  export type QueryEvent = {
    timestamp: Date
    query: string
    params: string
    duration: number
    target: string
  }

  export type LogEvent = {
    timestamp: Date
    message: string
    target: string
  }
  /* End Types for Logging */


  export type PrismaAction =
    | 'findUnique'
    | 'findUniqueOrThrow'
    | 'findMany'
    | 'findFirst'
    | 'findFirstOrThrow'
    | 'create'
    | 'createMany'
    | 'createManyAndReturn'
    | 'update'
    | 'updateMany'
    | 'upsert'
    | 'delete'
    | 'deleteMany'
    | 'executeRaw'
    | 'queryRaw'
    | 'aggregate'
    | 'count'
    | 'runCommandRaw'
    | 'findRaw'
    | 'groupBy'

  /**
   * These options are being passed into the middleware as "params"
   */
  export type MiddlewareParams = {
    model?: ModelName
    action: PrismaAction
    args: any
    dataPath: string[]
    runInTransaction: boolean
  }

  /**
   * The `T` type makes sure, that the `return proceed` is not forgotten in the middleware implementation
   */
  export type Middleware<T = any> = (
    params: MiddlewareParams,
    next: (params: MiddlewareParams) => $Utils.JsPromise<T>,
  ) => $Utils.JsPromise<T>

  // tested in getLogLevel.test.ts
  export function getLogLevel(log: Array<LogLevel | LogDefinition>): LogLevel | undefined;

  /**
   * `PrismaClient` proxy available in interactive transactions.
   */
  export type TransactionClient = Omit<Prisma.DefaultPrismaClient, runtime.ITXClientDenyList>

  export type Datasource = {
    url?: string
  }

  /**
   * Count Types
   */


  /**
   * Count Type CompanyCountOutputType
   */

  export type CompanyCountOutputType = {
    users: number
    channels: number
    bots: number
    contacts: number
    conversations: number
    tickets: number
  }

  export type CompanyCountOutputTypeSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    users?: boolean | CompanyCountOutputTypeCountUsersArgs
    channels?: boolean | CompanyCountOutputTypeCountChannelsArgs
    bots?: boolean | CompanyCountOutputTypeCountBotsArgs
    contacts?: boolean | CompanyCountOutputTypeCountContactsArgs
    conversations?: boolean | CompanyCountOutputTypeCountConversationsArgs
    tickets?: boolean | CompanyCountOutputTypeCountTicketsArgs
  }

  // Custom InputTypes
  /**
   * CompanyCountOutputType without action
   */
  export type CompanyCountOutputTypeDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the CompanyCountOutputType
     */
    select?: CompanyCountOutputTypeSelect<ExtArgs> | null
  }

  /**
   * CompanyCountOutputType without action
   */
  export type CompanyCountOutputTypeCountUsersArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: UserWhereInput
  }

  /**
   * CompanyCountOutputType without action
   */
  export type CompanyCountOutputTypeCountChannelsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: ChannelWhereInput
  }

  /**
   * CompanyCountOutputType without action
   */
  export type CompanyCountOutputTypeCountBotsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: BotWhereInput
  }

  /**
   * CompanyCountOutputType without action
   */
  export type CompanyCountOutputTypeCountContactsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: ContactWhereInput
  }

  /**
   * CompanyCountOutputType without action
   */
  export type CompanyCountOutputTypeCountConversationsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: ConversationWhereInput
  }

  /**
   * CompanyCountOutputType without action
   */
  export type CompanyCountOutputTypeCountTicketsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: TicketWhereInput
  }


  /**
   * Count Type UserCountOutputType
   */

  export type UserCountOutputType = {
    assigned_conversations: number
    assigned_tickets: number
  }

  export type UserCountOutputTypeSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    assigned_conversations?: boolean | UserCountOutputTypeCountAssigned_conversationsArgs
    assigned_tickets?: boolean | UserCountOutputTypeCountAssigned_ticketsArgs
  }

  // Custom InputTypes
  /**
   * UserCountOutputType without action
   */
  export type UserCountOutputTypeDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the UserCountOutputType
     */
    select?: UserCountOutputTypeSelect<ExtArgs> | null
  }

  /**
   * UserCountOutputType without action
   */
  export type UserCountOutputTypeCountAssigned_conversationsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: ConversationWhereInput
  }

  /**
   * UserCountOutputType without action
   */
  export type UserCountOutputTypeCountAssigned_ticketsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: TicketWhereInput
  }


  /**
   * Count Type ChannelCountOutputType
   */

  export type ChannelCountOutputType = {
    conversations: number
    channel_bots: number
    webhook_events: number
  }

  export type ChannelCountOutputTypeSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    conversations?: boolean | ChannelCountOutputTypeCountConversationsArgs
    channel_bots?: boolean | ChannelCountOutputTypeCountChannel_botsArgs
    webhook_events?: boolean | ChannelCountOutputTypeCountWebhook_eventsArgs
  }

  // Custom InputTypes
  /**
   * ChannelCountOutputType without action
   */
  export type ChannelCountOutputTypeDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ChannelCountOutputType
     */
    select?: ChannelCountOutputTypeSelect<ExtArgs> | null
  }

  /**
   * ChannelCountOutputType without action
   */
  export type ChannelCountOutputTypeCountConversationsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: ConversationWhereInput
  }

  /**
   * ChannelCountOutputType without action
   */
  export type ChannelCountOutputTypeCountChannel_botsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: ChannelBotWhereInput
  }

  /**
   * ChannelCountOutputType without action
   */
  export type ChannelCountOutputTypeCountWebhook_eventsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: WebhookEventWhereInput
  }


  /**
   * Count Type BotCountOutputType
   */

  export type BotCountOutputType = {
    conversations: number
    channel_bots: number
  }

  export type BotCountOutputTypeSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    conversations?: boolean | BotCountOutputTypeCountConversationsArgs
    channel_bots?: boolean | BotCountOutputTypeCountChannel_botsArgs
  }

  // Custom InputTypes
  /**
   * BotCountOutputType without action
   */
  export type BotCountOutputTypeDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the BotCountOutputType
     */
    select?: BotCountOutputTypeSelect<ExtArgs> | null
  }

  /**
   * BotCountOutputType without action
   */
  export type BotCountOutputTypeCountConversationsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: ConversationWhereInput
  }

  /**
   * BotCountOutputType without action
   */
  export type BotCountOutputTypeCountChannel_botsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: ChannelBotWhereInput
  }


  /**
   * Count Type ContactCountOutputType
   */

  export type ContactCountOutputType = {
    conversations: number
  }

  export type ContactCountOutputTypeSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    conversations?: boolean | ContactCountOutputTypeCountConversationsArgs
  }

  // Custom InputTypes
  /**
   * ContactCountOutputType without action
   */
  export type ContactCountOutputTypeDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ContactCountOutputType
     */
    select?: ContactCountOutputTypeSelect<ExtArgs> | null
  }

  /**
   * ContactCountOutputType without action
   */
  export type ContactCountOutputTypeCountConversationsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: ConversationWhereInput
  }


  /**
   * Count Type ConversationCountOutputType
   */

  export type ConversationCountOutputType = {
    messages: number
    tickets: number
  }

  export type ConversationCountOutputTypeSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    messages?: boolean | ConversationCountOutputTypeCountMessagesArgs
    tickets?: boolean | ConversationCountOutputTypeCountTicketsArgs
  }

  // Custom InputTypes
  /**
   * ConversationCountOutputType without action
   */
  export type ConversationCountOutputTypeDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ConversationCountOutputType
     */
    select?: ConversationCountOutputTypeSelect<ExtArgs> | null
  }

  /**
   * ConversationCountOutputType without action
   */
  export type ConversationCountOutputTypeCountMessagesArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: MessageWhereInput
  }

  /**
   * ConversationCountOutputType without action
   */
  export type ConversationCountOutputTypeCountTicketsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: TicketWhereInput
  }


  /**
   * Models
   */

  /**
   * Model Company
   */

  export type AggregateCompany = {
    _count: CompanyCountAggregateOutputType | null
    _min: CompanyMinAggregateOutputType | null
    _max: CompanyMaxAggregateOutputType | null
  }

  export type CompanyMinAggregateOutputType = {
    id: string | null
    name: string | null
    slug: string | null
    created_at: Date | null
    updated_at: Date | null
  }

  export type CompanyMaxAggregateOutputType = {
    id: string | null
    name: string | null
    slug: string | null
    created_at: Date | null
    updated_at: Date | null
  }

  export type CompanyCountAggregateOutputType = {
    id: number
    name: number
    slug: number
    settings: number
    created_at: number
    updated_at: number
    _all: number
  }


  export type CompanyMinAggregateInputType = {
    id?: true
    name?: true
    slug?: true
    created_at?: true
    updated_at?: true
  }

  export type CompanyMaxAggregateInputType = {
    id?: true
    name?: true
    slug?: true
    created_at?: true
    updated_at?: true
  }

  export type CompanyCountAggregateInputType = {
    id?: true
    name?: true
    slug?: true
    settings?: true
    created_at?: true
    updated_at?: true
    _all?: true
  }

  export type CompanyAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Company to aggregate.
     */
    where?: CompanyWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Companies to fetch.
     */
    orderBy?: CompanyOrderByWithRelationInput | CompanyOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: CompanyWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Companies from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Companies.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned Companies
    **/
    _count?: true | CompanyCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: CompanyMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: CompanyMaxAggregateInputType
  }

  export type GetCompanyAggregateType<T extends CompanyAggregateArgs> = {
        [P in keyof T & keyof AggregateCompany]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateCompany[P]>
      : GetScalarType<T[P], AggregateCompany[P]>
  }




  export type CompanyGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: CompanyWhereInput
    orderBy?: CompanyOrderByWithAggregationInput | CompanyOrderByWithAggregationInput[]
    by: CompanyScalarFieldEnum[] | CompanyScalarFieldEnum
    having?: CompanyScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: CompanyCountAggregateInputType | true
    _min?: CompanyMinAggregateInputType
    _max?: CompanyMaxAggregateInputType
  }

  export type CompanyGroupByOutputType = {
    id: string
    name: string
    slug: string
    settings: JsonValue
    created_at: Date
    updated_at: Date
    _count: CompanyCountAggregateOutputType | null
    _min: CompanyMinAggregateOutputType | null
    _max: CompanyMaxAggregateOutputType | null
  }

  type GetCompanyGroupByPayload<T extends CompanyGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<CompanyGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof CompanyGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], CompanyGroupByOutputType[P]>
            : GetScalarType<T[P], CompanyGroupByOutputType[P]>
        }
      >
    >


  export type CompanySelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    name?: boolean
    slug?: boolean
    settings?: boolean
    created_at?: boolean
    updated_at?: boolean
    users?: boolean | Company$usersArgs<ExtArgs>
    channels?: boolean | Company$channelsArgs<ExtArgs>
    bots?: boolean | Company$botsArgs<ExtArgs>
    contacts?: boolean | Company$contactsArgs<ExtArgs>
    conversations?: boolean | Company$conversationsArgs<ExtArgs>
    tickets?: boolean | Company$ticketsArgs<ExtArgs>
    _count?: boolean | CompanyCountOutputTypeDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["company"]>

  export type CompanySelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    name?: boolean
    slug?: boolean
    settings?: boolean
    created_at?: boolean
    updated_at?: boolean
  }, ExtArgs["result"]["company"]>

  export type CompanySelectScalar = {
    id?: boolean
    name?: boolean
    slug?: boolean
    settings?: boolean
    created_at?: boolean
    updated_at?: boolean
  }

  export type CompanyInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    users?: boolean | Company$usersArgs<ExtArgs>
    channels?: boolean | Company$channelsArgs<ExtArgs>
    bots?: boolean | Company$botsArgs<ExtArgs>
    contacts?: boolean | Company$contactsArgs<ExtArgs>
    conversations?: boolean | Company$conversationsArgs<ExtArgs>
    tickets?: boolean | Company$ticketsArgs<ExtArgs>
    _count?: boolean | CompanyCountOutputTypeDefaultArgs<ExtArgs>
  }
  export type CompanyIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {}

  export type $CompanyPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "Company"
    objects: {
      users: Prisma.$UserPayload<ExtArgs>[]
      channels: Prisma.$ChannelPayload<ExtArgs>[]
      bots: Prisma.$BotPayload<ExtArgs>[]
      contacts: Prisma.$ContactPayload<ExtArgs>[]
      conversations: Prisma.$ConversationPayload<ExtArgs>[]
      tickets: Prisma.$TicketPayload<ExtArgs>[]
    }
    scalars: $Extensions.GetPayloadResult<{
      id: string
      name: string
      slug: string
      settings: Prisma.JsonValue
      created_at: Date
      updated_at: Date
    }, ExtArgs["result"]["company"]>
    composites: {}
  }

  type CompanyGetPayload<S extends boolean | null | undefined | CompanyDefaultArgs> = $Result.GetResult<Prisma.$CompanyPayload, S>

  type CompanyCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = 
    Omit<CompanyFindManyArgs, 'select' | 'include' | 'distinct'> & {
      select?: CompanyCountAggregateInputType | true
    }

  export interface CompanyDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['Company'], meta: { name: 'Company' } }
    /**
     * Find zero or one Company that matches the filter.
     * @param {CompanyFindUniqueArgs} args - Arguments to find a Company
     * @example
     * // Get one Company
     * const company = await prisma.company.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends CompanyFindUniqueArgs>(args: SelectSubset<T, CompanyFindUniqueArgs<ExtArgs>>): Prisma__CompanyClient<$Result.GetResult<Prisma.$CompanyPayload<ExtArgs>, T, "findUnique"> | null, null, ExtArgs>

    /**
     * Find one Company that matches the filter or throw an error with `error.code='P2025'` 
     * if no matches were found.
     * @param {CompanyFindUniqueOrThrowArgs} args - Arguments to find a Company
     * @example
     * // Get one Company
     * const company = await prisma.company.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends CompanyFindUniqueOrThrowArgs>(args: SelectSubset<T, CompanyFindUniqueOrThrowArgs<ExtArgs>>): Prisma__CompanyClient<$Result.GetResult<Prisma.$CompanyPayload<ExtArgs>, T, "findUniqueOrThrow">, never, ExtArgs>

    /**
     * Find the first Company that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {CompanyFindFirstArgs} args - Arguments to find a Company
     * @example
     * // Get one Company
     * const company = await prisma.company.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends CompanyFindFirstArgs>(args?: SelectSubset<T, CompanyFindFirstArgs<ExtArgs>>): Prisma__CompanyClient<$Result.GetResult<Prisma.$CompanyPayload<ExtArgs>, T, "findFirst"> | null, null, ExtArgs>

    /**
     * Find the first Company that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {CompanyFindFirstOrThrowArgs} args - Arguments to find a Company
     * @example
     * // Get one Company
     * const company = await prisma.company.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends CompanyFindFirstOrThrowArgs>(args?: SelectSubset<T, CompanyFindFirstOrThrowArgs<ExtArgs>>): Prisma__CompanyClient<$Result.GetResult<Prisma.$CompanyPayload<ExtArgs>, T, "findFirstOrThrow">, never, ExtArgs>

    /**
     * Find zero or more Companies that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {CompanyFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all Companies
     * const companies = await prisma.company.findMany()
     * 
     * // Get first 10 Companies
     * const companies = await prisma.company.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const companyWithIdOnly = await prisma.company.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends CompanyFindManyArgs>(args?: SelectSubset<T, CompanyFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$CompanyPayload<ExtArgs>, T, "findMany">>

    /**
     * Create a Company.
     * @param {CompanyCreateArgs} args - Arguments to create a Company.
     * @example
     * // Create one Company
     * const Company = await prisma.company.create({
     *   data: {
     *     // ... data to create a Company
     *   }
     * })
     * 
     */
    create<T extends CompanyCreateArgs>(args: SelectSubset<T, CompanyCreateArgs<ExtArgs>>): Prisma__CompanyClient<$Result.GetResult<Prisma.$CompanyPayload<ExtArgs>, T, "create">, never, ExtArgs>

    /**
     * Create many Companies.
     * @param {CompanyCreateManyArgs} args - Arguments to create many Companies.
     * @example
     * // Create many Companies
     * const company = await prisma.company.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends CompanyCreateManyArgs>(args?: SelectSubset<T, CompanyCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many Companies and returns the data saved in the database.
     * @param {CompanyCreateManyAndReturnArgs} args - Arguments to create many Companies.
     * @example
     * // Create many Companies
     * const company = await prisma.company.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many Companies and only return the `id`
     * const companyWithIdOnly = await prisma.company.createManyAndReturn({ 
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends CompanyCreateManyAndReturnArgs>(args?: SelectSubset<T, CompanyCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$CompanyPayload<ExtArgs>, T, "createManyAndReturn">>

    /**
     * Delete a Company.
     * @param {CompanyDeleteArgs} args - Arguments to delete one Company.
     * @example
     * // Delete one Company
     * const Company = await prisma.company.delete({
     *   where: {
     *     // ... filter to delete one Company
     *   }
     * })
     * 
     */
    delete<T extends CompanyDeleteArgs>(args: SelectSubset<T, CompanyDeleteArgs<ExtArgs>>): Prisma__CompanyClient<$Result.GetResult<Prisma.$CompanyPayload<ExtArgs>, T, "delete">, never, ExtArgs>

    /**
     * Update one Company.
     * @param {CompanyUpdateArgs} args - Arguments to update one Company.
     * @example
     * // Update one Company
     * const company = await prisma.company.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends CompanyUpdateArgs>(args: SelectSubset<T, CompanyUpdateArgs<ExtArgs>>): Prisma__CompanyClient<$Result.GetResult<Prisma.$CompanyPayload<ExtArgs>, T, "update">, never, ExtArgs>

    /**
     * Delete zero or more Companies.
     * @param {CompanyDeleteManyArgs} args - Arguments to filter Companies to delete.
     * @example
     * // Delete a few Companies
     * const { count } = await prisma.company.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends CompanyDeleteManyArgs>(args?: SelectSubset<T, CompanyDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Companies.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {CompanyUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many Companies
     * const company = await prisma.company.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends CompanyUpdateManyArgs>(args: SelectSubset<T, CompanyUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create or update one Company.
     * @param {CompanyUpsertArgs} args - Arguments to update or create a Company.
     * @example
     * // Update or create a Company
     * const company = await prisma.company.upsert({
     *   create: {
     *     // ... data to create a Company
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the Company we want to update
     *   }
     * })
     */
    upsert<T extends CompanyUpsertArgs>(args: SelectSubset<T, CompanyUpsertArgs<ExtArgs>>): Prisma__CompanyClient<$Result.GetResult<Prisma.$CompanyPayload<ExtArgs>, T, "upsert">, never, ExtArgs>


    /**
     * Count the number of Companies.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {CompanyCountArgs} args - Arguments to filter Companies to count.
     * @example
     * // Count the number of Companies
     * const count = await prisma.company.count({
     *   where: {
     *     // ... the filter for the Companies we want to count
     *   }
     * })
    **/
    count<T extends CompanyCountArgs>(
      args?: Subset<T, CompanyCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], CompanyCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a Company.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {CompanyAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends CompanyAggregateArgs>(args: Subset<T, CompanyAggregateArgs>): Prisma.PrismaPromise<GetCompanyAggregateType<T>>

    /**
     * Group by Company.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {CompanyGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends CompanyGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: CompanyGroupByArgs['orderBy'] }
        : { orderBy?: CompanyGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, CompanyGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetCompanyGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the Company model
   */
  readonly fields: CompanyFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for Company.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__CompanyClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    users<T extends Company$usersArgs<ExtArgs> = {}>(args?: Subset<T, Company$usersArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "findMany"> | Null>
    channels<T extends Company$channelsArgs<ExtArgs> = {}>(args?: Subset<T, Company$channelsArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$ChannelPayload<ExtArgs>, T, "findMany"> | Null>
    bots<T extends Company$botsArgs<ExtArgs> = {}>(args?: Subset<T, Company$botsArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$BotPayload<ExtArgs>, T, "findMany"> | Null>
    contacts<T extends Company$contactsArgs<ExtArgs> = {}>(args?: Subset<T, Company$contactsArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$ContactPayload<ExtArgs>, T, "findMany"> | Null>
    conversations<T extends Company$conversationsArgs<ExtArgs> = {}>(args?: Subset<T, Company$conversationsArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$ConversationPayload<ExtArgs>, T, "findMany"> | Null>
    tickets<T extends Company$ticketsArgs<ExtArgs> = {}>(args?: Subset<T, Company$ticketsArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$TicketPayload<ExtArgs>, T, "findMany"> | Null>
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the Company model
   */ 
  interface CompanyFieldRefs {
    readonly id: FieldRef<"Company", 'String'>
    readonly name: FieldRef<"Company", 'String'>
    readonly slug: FieldRef<"Company", 'String'>
    readonly settings: FieldRef<"Company", 'Json'>
    readonly created_at: FieldRef<"Company", 'DateTime'>
    readonly updated_at: FieldRef<"Company", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * Company findUnique
   */
  export type CompanyFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Company
     */
    select?: CompanySelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CompanyInclude<ExtArgs> | null
    /**
     * Filter, which Company to fetch.
     */
    where: CompanyWhereUniqueInput
  }

  /**
   * Company findUniqueOrThrow
   */
  export type CompanyFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Company
     */
    select?: CompanySelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CompanyInclude<ExtArgs> | null
    /**
     * Filter, which Company to fetch.
     */
    where: CompanyWhereUniqueInput
  }

  /**
   * Company findFirst
   */
  export type CompanyFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Company
     */
    select?: CompanySelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CompanyInclude<ExtArgs> | null
    /**
     * Filter, which Company to fetch.
     */
    where?: CompanyWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Companies to fetch.
     */
    orderBy?: CompanyOrderByWithRelationInput | CompanyOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Companies.
     */
    cursor?: CompanyWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Companies from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Companies.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Companies.
     */
    distinct?: CompanyScalarFieldEnum | CompanyScalarFieldEnum[]
  }

  /**
   * Company findFirstOrThrow
   */
  export type CompanyFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Company
     */
    select?: CompanySelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CompanyInclude<ExtArgs> | null
    /**
     * Filter, which Company to fetch.
     */
    where?: CompanyWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Companies to fetch.
     */
    orderBy?: CompanyOrderByWithRelationInput | CompanyOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Companies.
     */
    cursor?: CompanyWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Companies from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Companies.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Companies.
     */
    distinct?: CompanyScalarFieldEnum | CompanyScalarFieldEnum[]
  }

  /**
   * Company findMany
   */
  export type CompanyFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Company
     */
    select?: CompanySelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CompanyInclude<ExtArgs> | null
    /**
     * Filter, which Companies to fetch.
     */
    where?: CompanyWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Companies to fetch.
     */
    orderBy?: CompanyOrderByWithRelationInput | CompanyOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing Companies.
     */
    cursor?: CompanyWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Companies from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Companies.
     */
    skip?: number
    distinct?: CompanyScalarFieldEnum | CompanyScalarFieldEnum[]
  }

  /**
   * Company create
   */
  export type CompanyCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Company
     */
    select?: CompanySelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CompanyInclude<ExtArgs> | null
    /**
     * The data needed to create a Company.
     */
    data: XOR<CompanyCreateInput, CompanyUncheckedCreateInput>
  }

  /**
   * Company createMany
   */
  export type CompanyCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many Companies.
     */
    data: CompanyCreateManyInput | CompanyCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * Company createManyAndReturn
   */
  export type CompanyCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Company
     */
    select?: CompanySelectCreateManyAndReturn<ExtArgs> | null
    /**
     * The data used to create many Companies.
     */
    data: CompanyCreateManyInput | CompanyCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * Company update
   */
  export type CompanyUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Company
     */
    select?: CompanySelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CompanyInclude<ExtArgs> | null
    /**
     * The data needed to update a Company.
     */
    data: XOR<CompanyUpdateInput, CompanyUncheckedUpdateInput>
    /**
     * Choose, which Company to update.
     */
    where: CompanyWhereUniqueInput
  }

  /**
   * Company updateMany
   */
  export type CompanyUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update Companies.
     */
    data: XOR<CompanyUpdateManyMutationInput, CompanyUncheckedUpdateManyInput>
    /**
     * Filter which Companies to update
     */
    where?: CompanyWhereInput
  }

  /**
   * Company upsert
   */
  export type CompanyUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Company
     */
    select?: CompanySelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CompanyInclude<ExtArgs> | null
    /**
     * The filter to search for the Company to update in case it exists.
     */
    where: CompanyWhereUniqueInput
    /**
     * In case the Company found by the `where` argument doesn't exist, create a new Company with this data.
     */
    create: XOR<CompanyCreateInput, CompanyUncheckedCreateInput>
    /**
     * In case the Company was found with the provided `where` argument, update it with this data.
     */
    update: XOR<CompanyUpdateInput, CompanyUncheckedUpdateInput>
  }

  /**
   * Company delete
   */
  export type CompanyDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Company
     */
    select?: CompanySelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CompanyInclude<ExtArgs> | null
    /**
     * Filter which Company to delete.
     */
    where: CompanyWhereUniqueInput
  }

  /**
   * Company deleteMany
   */
  export type CompanyDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Companies to delete
     */
    where?: CompanyWhereInput
  }

  /**
   * Company.users
   */
  export type Company$usersArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the User
     */
    select?: UserSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: UserInclude<ExtArgs> | null
    where?: UserWhereInput
    orderBy?: UserOrderByWithRelationInput | UserOrderByWithRelationInput[]
    cursor?: UserWhereUniqueInput
    take?: number
    skip?: number
    distinct?: UserScalarFieldEnum | UserScalarFieldEnum[]
  }

  /**
   * Company.channels
   */
  export type Company$channelsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Channel
     */
    select?: ChannelSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ChannelInclude<ExtArgs> | null
    where?: ChannelWhereInput
    orderBy?: ChannelOrderByWithRelationInput | ChannelOrderByWithRelationInput[]
    cursor?: ChannelWhereUniqueInput
    take?: number
    skip?: number
    distinct?: ChannelScalarFieldEnum | ChannelScalarFieldEnum[]
  }

  /**
   * Company.bots
   */
  export type Company$botsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Bot
     */
    select?: BotSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: BotInclude<ExtArgs> | null
    where?: BotWhereInput
    orderBy?: BotOrderByWithRelationInput | BotOrderByWithRelationInput[]
    cursor?: BotWhereUniqueInput
    take?: number
    skip?: number
    distinct?: BotScalarFieldEnum | BotScalarFieldEnum[]
  }

  /**
   * Company.contacts
   */
  export type Company$contactsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Contact
     */
    select?: ContactSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ContactInclude<ExtArgs> | null
    where?: ContactWhereInput
    orderBy?: ContactOrderByWithRelationInput | ContactOrderByWithRelationInput[]
    cursor?: ContactWhereUniqueInput
    take?: number
    skip?: number
    distinct?: ContactScalarFieldEnum | ContactScalarFieldEnum[]
  }

  /**
   * Company.conversations
   */
  export type Company$conversationsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Conversation
     */
    select?: ConversationSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ConversationInclude<ExtArgs> | null
    where?: ConversationWhereInput
    orderBy?: ConversationOrderByWithRelationInput | ConversationOrderByWithRelationInput[]
    cursor?: ConversationWhereUniqueInput
    take?: number
    skip?: number
    distinct?: ConversationScalarFieldEnum | ConversationScalarFieldEnum[]
  }

  /**
   * Company.tickets
   */
  export type Company$ticketsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Ticket
     */
    select?: TicketSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TicketInclude<ExtArgs> | null
    where?: TicketWhereInput
    orderBy?: TicketOrderByWithRelationInput | TicketOrderByWithRelationInput[]
    cursor?: TicketWhereUniqueInput
    take?: number
    skip?: number
    distinct?: TicketScalarFieldEnum | TicketScalarFieldEnum[]
  }

  /**
   * Company without action
   */
  export type CompanyDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Company
     */
    select?: CompanySelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CompanyInclude<ExtArgs> | null
  }


  /**
   * Model User
   */

  export type AggregateUser = {
    _count: UserCountAggregateOutputType | null
    _min: UserMinAggregateOutputType | null
    _max: UserMaxAggregateOutputType | null
  }

  export type UserMinAggregateOutputType = {
    id: string | null
    email: string | null
    password_hash: string | null
    name: string | null
    role: string | null
    company_id: string | null
    is_active: boolean | null
    created_at: Date | null
    updated_at: Date | null
  }

  export type UserMaxAggregateOutputType = {
    id: string | null
    email: string | null
    password_hash: string | null
    name: string | null
    role: string | null
    company_id: string | null
    is_active: boolean | null
    created_at: Date | null
    updated_at: Date | null
  }

  export type UserCountAggregateOutputType = {
    id: number
    email: number
    password_hash: number
    name: number
    role: number
    company_id: number
    is_active: number
    created_at: number
    updated_at: number
    _all: number
  }


  export type UserMinAggregateInputType = {
    id?: true
    email?: true
    password_hash?: true
    name?: true
    role?: true
    company_id?: true
    is_active?: true
    created_at?: true
    updated_at?: true
  }

  export type UserMaxAggregateInputType = {
    id?: true
    email?: true
    password_hash?: true
    name?: true
    role?: true
    company_id?: true
    is_active?: true
    created_at?: true
    updated_at?: true
  }

  export type UserCountAggregateInputType = {
    id?: true
    email?: true
    password_hash?: true
    name?: true
    role?: true
    company_id?: true
    is_active?: true
    created_at?: true
    updated_at?: true
    _all?: true
  }

  export type UserAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which User to aggregate.
     */
    where?: UserWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Users to fetch.
     */
    orderBy?: UserOrderByWithRelationInput | UserOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: UserWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Users from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Users.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned Users
    **/
    _count?: true | UserCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: UserMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: UserMaxAggregateInputType
  }

  export type GetUserAggregateType<T extends UserAggregateArgs> = {
        [P in keyof T & keyof AggregateUser]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateUser[P]>
      : GetScalarType<T[P], AggregateUser[P]>
  }




  export type UserGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: UserWhereInput
    orderBy?: UserOrderByWithAggregationInput | UserOrderByWithAggregationInput[]
    by: UserScalarFieldEnum[] | UserScalarFieldEnum
    having?: UserScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: UserCountAggregateInputType | true
    _min?: UserMinAggregateInputType
    _max?: UserMaxAggregateInputType
  }

  export type UserGroupByOutputType = {
    id: string
    email: string
    password_hash: string
    name: string
    role: string
    company_id: string
    is_active: boolean
    created_at: Date
    updated_at: Date
    _count: UserCountAggregateOutputType | null
    _min: UserMinAggregateOutputType | null
    _max: UserMaxAggregateOutputType | null
  }

  type GetUserGroupByPayload<T extends UserGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<UserGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof UserGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], UserGroupByOutputType[P]>
            : GetScalarType<T[P], UserGroupByOutputType[P]>
        }
      >
    >


  export type UserSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    email?: boolean
    password_hash?: boolean
    name?: boolean
    role?: boolean
    company_id?: boolean
    is_active?: boolean
    created_at?: boolean
    updated_at?: boolean
    company?: boolean | CompanyDefaultArgs<ExtArgs>
    assigned_conversations?: boolean | User$assigned_conversationsArgs<ExtArgs>
    assigned_tickets?: boolean | User$assigned_ticketsArgs<ExtArgs>
    _count?: boolean | UserCountOutputTypeDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["user"]>

  export type UserSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    email?: boolean
    password_hash?: boolean
    name?: boolean
    role?: boolean
    company_id?: boolean
    is_active?: boolean
    created_at?: boolean
    updated_at?: boolean
    company?: boolean | CompanyDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["user"]>

  export type UserSelectScalar = {
    id?: boolean
    email?: boolean
    password_hash?: boolean
    name?: boolean
    role?: boolean
    company_id?: boolean
    is_active?: boolean
    created_at?: boolean
    updated_at?: boolean
  }

  export type UserInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    company?: boolean | CompanyDefaultArgs<ExtArgs>
    assigned_conversations?: boolean | User$assigned_conversationsArgs<ExtArgs>
    assigned_tickets?: boolean | User$assigned_ticketsArgs<ExtArgs>
    _count?: boolean | UserCountOutputTypeDefaultArgs<ExtArgs>
  }
  export type UserIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    company?: boolean | CompanyDefaultArgs<ExtArgs>
  }

  export type $UserPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "User"
    objects: {
      company: Prisma.$CompanyPayload<ExtArgs>
      assigned_conversations: Prisma.$ConversationPayload<ExtArgs>[]
      assigned_tickets: Prisma.$TicketPayload<ExtArgs>[]
    }
    scalars: $Extensions.GetPayloadResult<{
      id: string
      email: string
      password_hash: string
      name: string
      role: string
      company_id: string
      is_active: boolean
      created_at: Date
      updated_at: Date
    }, ExtArgs["result"]["user"]>
    composites: {}
  }

  type UserGetPayload<S extends boolean | null | undefined | UserDefaultArgs> = $Result.GetResult<Prisma.$UserPayload, S>

  type UserCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = 
    Omit<UserFindManyArgs, 'select' | 'include' | 'distinct'> & {
      select?: UserCountAggregateInputType | true
    }

  export interface UserDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['User'], meta: { name: 'User' } }
    /**
     * Find zero or one User that matches the filter.
     * @param {UserFindUniqueArgs} args - Arguments to find a User
     * @example
     * // Get one User
     * const user = await prisma.user.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends UserFindUniqueArgs>(args: SelectSubset<T, UserFindUniqueArgs<ExtArgs>>): Prisma__UserClient<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "findUnique"> | null, null, ExtArgs>

    /**
     * Find one User that matches the filter or throw an error with `error.code='P2025'` 
     * if no matches were found.
     * @param {UserFindUniqueOrThrowArgs} args - Arguments to find a User
     * @example
     * // Get one User
     * const user = await prisma.user.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends UserFindUniqueOrThrowArgs>(args: SelectSubset<T, UserFindUniqueOrThrowArgs<ExtArgs>>): Prisma__UserClient<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "findUniqueOrThrow">, never, ExtArgs>

    /**
     * Find the first User that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {UserFindFirstArgs} args - Arguments to find a User
     * @example
     * // Get one User
     * const user = await prisma.user.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends UserFindFirstArgs>(args?: SelectSubset<T, UserFindFirstArgs<ExtArgs>>): Prisma__UserClient<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "findFirst"> | null, null, ExtArgs>

    /**
     * Find the first User that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {UserFindFirstOrThrowArgs} args - Arguments to find a User
     * @example
     * // Get one User
     * const user = await prisma.user.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends UserFindFirstOrThrowArgs>(args?: SelectSubset<T, UserFindFirstOrThrowArgs<ExtArgs>>): Prisma__UserClient<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "findFirstOrThrow">, never, ExtArgs>

    /**
     * Find zero or more Users that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {UserFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all Users
     * const users = await prisma.user.findMany()
     * 
     * // Get first 10 Users
     * const users = await prisma.user.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const userWithIdOnly = await prisma.user.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends UserFindManyArgs>(args?: SelectSubset<T, UserFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "findMany">>

    /**
     * Create a User.
     * @param {UserCreateArgs} args - Arguments to create a User.
     * @example
     * // Create one User
     * const User = await prisma.user.create({
     *   data: {
     *     // ... data to create a User
     *   }
     * })
     * 
     */
    create<T extends UserCreateArgs>(args: SelectSubset<T, UserCreateArgs<ExtArgs>>): Prisma__UserClient<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "create">, never, ExtArgs>

    /**
     * Create many Users.
     * @param {UserCreateManyArgs} args - Arguments to create many Users.
     * @example
     * // Create many Users
     * const user = await prisma.user.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends UserCreateManyArgs>(args?: SelectSubset<T, UserCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many Users and returns the data saved in the database.
     * @param {UserCreateManyAndReturnArgs} args - Arguments to create many Users.
     * @example
     * // Create many Users
     * const user = await prisma.user.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many Users and only return the `id`
     * const userWithIdOnly = await prisma.user.createManyAndReturn({ 
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends UserCreateManyAndReturnArgs>(args?: SelectSubset<T, UserCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "createManyAndReturn">>

    /**
     * Delete a User.
     * @param {UserDeleteArgs} args - Arguments to delete one User.
     * @example
     * // Delete one User
     * const User = await prisma.user.delete({
     *   where: {
     *     // ... filter to delete one User
     *   }
     * })
     * 
     */
    delete<T extends UserDeleteArgs>(args: SelectSubset<T, UserDeleteArgs<ExtArgs>>): Prisma__UserClient<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "delete">, never, ExtArgs>

    /**
     * Update one User.
     * @param {UserUpdateArgs} args - Arguments to update one User.
     * @example
     * // Update one User
     * const user = await prisma.user.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends UserUpdateArgs>(args: SelectSubset<T, UserUpdateArgs<ExtArgs>>): Prisma__UserClient<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "update">, never, ExtArgs>

    /**
     * Delete zero or more Users.
     * @param {UserDeleteManyArgs} args - Arguments to filter Users to delete.
     * @example
     * // Delete a few Users
     * const { count } = await prisma.user.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends UserDeleteManyArgs>(args?: SelectSubset<T, UserDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Users.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {UserUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many Users
     * const user = await prisma.user.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends UserUpdateManyArgs>(args: SelectSubset<T, UserUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create or update one User.
     * @param {UserUpsertArgs} args - Arguments to update or create a User.
     * @example
     * // Update or create a User
     * const user = await prisma.user.upsert({
     *   create: {
     *     // ... data to create a User
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the User we want to update
     *   }
     * })
     */
    upsert<T extends UserUpsertArgs>(args: SelectSubset<T, UserUpsertArgs<ExtArgs>>): Prisma__UserClient<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "upsert">, never, ExtArgs>


    /**
     * Count the number of Users.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {UserCountArgs} args - Arguments to filter Users to count.
     * @example
     * // Count the number of Users
     * const count = await prisma.user.count({
     *   where: {
     *     // ... the filter for the Users we want to count
     *   }
     * })
    **/
    count<T extends UserCountArgs>(
      args?: Subset<T, UserCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], UserCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a User.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {UserAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends UserAggregateArgs>(args: Subset<T, UserAggregateArgs>): Prisma.PrismaPromise<GetUserAggregateType<T>>

    /**
     * Group by User.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {UserGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends UserGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: UserGroupByArgs['orderBy'] }
        : { orderBy?: UserGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, UserGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetUserGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the User model
   */
  readonly fields: UserFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for User.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__UserClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    company<T extends CompanyDefaultArgs<ExtArgs> = {}>(args?: Subset<T, CompanyDefaultArgs<ExtArgs>>): Prisma__CompanyClient<$Result.GetResult<Prisma.$CompanyPayload<ExtArgs>, T, "findUniqueOrThrow"> | Null, Null, ExtArgs>
    assigned_conversations<T extends User$assigned_conversationsArgs<ExtArgs> = {}>(args?: Subset<T, User$assigned_conversationsArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$ConversationPayload<ExtArgs>, T, "findMany"> | Null>
    assigned_tickets<T extends User$assigned_ticketsArgs<ExtArgs> = {}>(args?: Subset<T, User$assigned_ticketsArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$TicketPayload<ExtArgs>, T, "findMany"> | Null>
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the User model
   */ 
  interface UserFieldRefs {
    readonly id: FieldRef<"User", 'String'>
    readonly email: FieldRef<"User", 'String'>
    readonly password_hash: FieldRef<"User", 'String'>
    readonly name: FieldRef<"User", 'String'>
    readonly role: FieldRef<"User", 'String'>
    readonly company_id: FieldRef<"User", 'String'>
    readonly is_active: FieldRef<"User", 'Boolean'>
    readonly created_at: FieldRef<"User", 'DateTime'>
    readonly updated_at: FieldRef<"User", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * User findUnique
   */
  export type UserFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the User
     */
    select?: UserSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: UserInclude<ExtArgs> | null
    /**
     * Filter, which User to fetch.
     */
    where: UserWhereUniqueInput
  }

  /**
   * User findUniqueOrThrow
   */
  export type UserFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the User
     */
    select?: UserSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: UserInclude<ExtArgs> | null
    /**
     * Filter, which User to fetch.
     */
    where: UserWhereUniqueInput
  }

  /**
   * User findFirst
   */
  export type UserFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the User
     */
    select?: UserSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: UserInclude<ExtArgs> | null
    /**
     * Filter, which User to fetch.
     */
    where?: UserWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Users to fetch.
     */
    orderBy?: UserOrderByWithRelationInput | UserOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Users.
     */
    cursor?: UserWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Users from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Users.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Users.
     */
    distinct?: UserScalarFieldEnum | UserScalarFieldEnum[]
  }

  /**
   * User findFirstOrThrow
   */
  export type UserFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the User
     */
    select?: UserSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: UserInclude<ExtArgs> | null
    /**
     * Filter, which User to fetch.
     */
    where?: UserWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Users to fetch.
     */
    orderBy?: UserOrderByWithRelationInput | UserOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Users.
     */
    cursor?: UserWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Users from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Users.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Users.
     */
    distinct?: UserScalarFieldEnum | UserScalarFieldEnum[]
  }

  /**
   * User findMany
   */
  export type UserFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the User
     */
    select?: UserSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: UserInclude<ExtArgs> | null
    /**
     * Filter, which Users to fetch.
     */
    where?: UserWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Users to fetch.
     */
    orderBy?: UserOrderByWithRelationInput | UserOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing Users.
     */
    cursor?: UserWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Users from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Users.
     */
    skip?: number
    distinct?: UserScalarFieldEnum | UserScalarFieldEnum[]
  }

  /**
   * User create
   */
  export type UserCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the User
     */
    select?: UserSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: UserInclude<ExtArgs> | null
    /**
     * The data needed to create a User.
     */
    data: XOR<UserCreateInput, UserUncheckedCreateInput>
  }

  /**
   * User createMany
   */
  export type UserCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many Users.
     */
    data: UserCreateManyInput | UserCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * User createManyAndReturn
   */
  export type UserCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the User
     */
    select?: UserSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * The data used to create many Users.
     */
    data: UserCreateManyInput | UserCreateManyInput[]
    skipDuplicates?: boolean
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: UserIncludeCreateManyAndReturn<ExtArgs> | null
  }

  /**
   * User update
   */
  export type UserUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the User
     */
    select?: UserSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: UserInclude<ExtArgs> | null
    /**
     * The data needed to update a User.
     */
    data: XOR<UserUpdateInput, UserUncheckedUpdateInput>
    /**
     * Choose, which User to update.
     */
    where: UserWhereUniqueInput
  }

  /**
   * User updateMany
   */
  export type UserUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update Users.
     */
    data: XOR<UserUpdateManyMutationInput, UserUncheckedUpdateManyInput>
    /**
     * Filter which Users to update
     */
    where?: UserWhereInput
  }

  /**
   * User upsert
   */
  export type UserUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the User
     */
    select?: UserSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: UserInclude<ExtArgs> | null
    /**
     * The filter to search for the User to update in case it exists.
     */
    where: UserWhereUniqueInput
    /**
     * In case the User found by the `where` argument doesn't exist, create a new User with this data.
     */
    create: XOR<UserCreateInput, UserUncheckedCreateInput>
    /**
     * In case the User was found with the provided `where` argument, update it with this data.
     */
    update: XOR<UserUpdateInput, UserUncheckedUpdateInput>
  }

  /**
   * User delete
   */
  export type UserDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the User
     */
    select?: UserSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: UserInclude<ExtArgs> | null
    /**
     * Filter which User to delete.
     */
    where: UserWhereUniqueInput
  }

  /**
   * User deleteMany
   */
  export type UserDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Users to delete
     */
    where?: UserWhereInput
  }

  /**
   * User.assigned_conversations
   */
  export type User$assigned_conversationsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Conversation
     */
    select?: ConversationSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ConversationInclude<ExtArgs> | null
    where?: ConversationWhereInput
    orderBy?: ConversationOrderByWithRelationInput | ConversationOrderByWithRelationInput[]
    cursor?: ConversationWhereUniqueInput
    take?: number
    skip?: number
    distinct?: ConversationScalarFieldEnum | ConversationScalarFieldEnum[]
  }

  /**
   * User.assigned_tickets
   */
  export type User$assigned_ticketsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Ticket
     */
    select?: TicketSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TicketInclude<ExtArgs> | null
    where?: TicketWhereInput
    orderBy?: TicketOrderByWithRelationInput | TicketOrderByWithRelationInput[]
    cursor?: TicketWhereUniqueInput
    take?: number
    skip?: number
    distinct?: TicketScalarFieldEnum | TicketScalarFieldEnum[]
  }

  /**
   * User without action
   */
  export type UserDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the User
     */
    select?: UserSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: UserInclude<ExtArgs> | null
  }


  /**
   * Model Channel
   */

  export type AggregateChannel = {
    _count: ChannelCountAggregateOutputType | null
    _min: ChannelMinAggregateOutputType | null
    _max: ChannelMaxAggregateOutputType | null
  }

  export type ChannelMinAggregateOutputType = {
    id: string | null
    name: string | null
    type: string | null
    status: string | null
    phone_number: string | null
    instance_id: string | null
    api_key: string | null
    webhook_url: string | null
    company_id: string | null
    created_at: Date | null
    updated_at: Date | null
  }

  export type ChannelMaxAggregateOutputType = {
    id: string | null
    name: string | null
    type: string | null
    status: string | null
    phone_number: string | null
    instance_id: string | null
    api_key: string | null
    webhook_url: string | null
    company_id: string | null
    created_at: Date | null
    updated_at: Date | null
  }

  export type ChannelCountAggregateOutputType = {
    id: number
    name: number
    type: number
    status: number
    phone_number: number
    instance_id: number
    api_key: number
    webhook_url: number
    settings: number
    company_id: number
    created_at: number
    updated_at: number
    _all: number
  }


  export type ChannelMinAggregateInputType = {
    id?: true
    name?: true
    type?: true
    status?: true
    phone_number?: true
    instance_id?: true
    api_key?: true
    webhook_url?: true
    company_id?: true
    created_at?: true
    updated_at?: true
  }

  export type ChannelMaxAggregateInputType = {
    id?: true
    name?: true
    type?: true
    status?: true
    phone_number?: true
    instance_id?: true
    api_key?: true
    webhook_url?: true
    company_id?: true
    created_at?: true
    updated_at?: true
  }

  export type ChannelCountAggregateInputType = {
    id?: true
    name?: true
    type?: true
    status?: true
    phone_number?: true
    instance_id?: true
    api_key?: true
    webhook_url?: true
    settings?: true
    company_id?: true
    created_at?: true
    updated_at?: true
    _all?: true
  }

  export type ChannelAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Channel to aggregate.
     */
    where?: ChannelWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Channels to fetch.
     */
    orderBy?: ChannelOrderByWithRelationInput | ChannelOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: ChannelWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Channels from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Channels.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned Channels
    **/
    _count?: true | ChannelCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: ChannelMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: ChannelMaxAggregateInputType
  }

  export type GetChannelAggregateType<T extends ChannelAggregateArgs> = {
        [P in keyof T & keyof AggregateChannel]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateChannel[P]>
      : GetScalarType<T[P], AggregateChannel[P]>
  }




  export type ChannelGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: ChannelWhereInput
    orderBy?: ChannelOrderByWithAggregationInput | ChannelOrderByWithAggregationInput[]
    by: ChannelScalarFieldEnum[] | ChannelScalarFieldEnum
    having?: ChannelScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: ChannelCountAggregateInputType | true
    _min?: ChannelMinAggregateInputType
    _max?: ChannelMaxAggregateInputType
  }

  export type ChannelGroupByOutputType = {
    id: string
    name: string
    type: string
    status: string
    phone_number: string | null
    instance_id: string | null
    api_key: string | null
    webhook_url: string | null
    settings: JsonValue
    company_id: string
    created_at: Date
    updated_at: Date
    _count: ChannelCountAggregateOutputType | null
    _min: ChannelMinAggregateOutputType | null
    _max: ChannelMaxAggregateOutputType | null
  }

  type GetChannelGroupByPayload<T extends ChannelGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<ChannelGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof ChannelGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], ChannelGroupByOutputType[P]>
            : GetScalarType<T[P], ChannelGroupByOutputType[P]>
        }
      >
    >


  export type ChannelSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    name?: boolean
    type?: boolean
    status?: boolean
    phone_number?: boolean
    instance_id?: boolean
    api_key?: boolean
    webhook_url?: boolean
    settings?: boolean
    company_id?: boolean
    created_at?: boolean
    updated_at?: boolean
    company?: boolean | CompanyDefaultArgs<ExtArgs>
    conversations?: boolean | Channel$conversationsArgs<ExtArgs>
    channel_bots?: boolean | Channel$channel_botsArgs<ExtArgs>
    webhook_events?: boolean | Channel$webhook_eventsArgs<ExtArgs>
    _count?: boolean | ChannelCountOutputTypeDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["channel"]>

  export type ChannelSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    name?: boolean
    type?: boolean
    status?: boolean
    phone_number?: boolean
    instance_id?: boolean
    api_key?: boolean
    webhook_url?: boolean
    settings?: boolean
    company_id?: boolean
    created_at?: boolean
    updated_at?: boolean
    company?: boolean | CompanyDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["channel"]>

  export type ChannelSelectScalar = {
    id?: boolean
    name?: boolean
    type?: boolean
    status?: boolean
    phone_number?: boolean
    instance_id?: boolean
    api_key?: boolean
    webhook_url?: boolean
    settings?: boolean
    company_id?: boolean
    created_at?: boolean
    updated_at?: boolean
  }

  export type ChannelInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    company?: boolean | CompanyDefaultArgs<ExtArgs>
    conversations?: boolean | Channel$conversationsArgs<ExtArgs>
    channel_bots?: boolean | Channel$channel_botsArgs<ExtArgs>
    webhook_events?: boolean | Channel$webhook_eventsArgs<ExtArgs>
    _count?: boolean | ChannelCountOutputTypeDefaultArgs<ExtArgs>
  }
  export type ChannelIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    company?: boolean | CompanyDefaultArgs<ExtArgs>
  }

  export type $ChannelPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "Channel"
    objects: {
      company: Prisma.$CompanyPayload<ExtArgs>
      conversations: Prisma.$ConversationPayload<ExtArgs>[]
      channel_bots: Prisma.$ChannelBotPayload<ExtArgs>[]
      webhook_events: Prisma.$WebhookEventPayload<ExtArgs>[]
    }
    scalars: $Extensions.GetPayloadResult<{
      id: string
      name: string
      type: string
      status: string
      phone_number: string | null
      instance_id: string | null
      api_key: string | null
      webhook_url: string | null
      settings: Prisma.JsonValue
      company_id: string
      created_at: Date
      updated_at: Date
    }, ExtArgs["result"]["channel"]>
    composites: {}
  }

  type ChannelGetPayload<S extends boolean | null | undefined | ChannelDefaultArgs> = $Result.GetResult<Prisma.$ChannelPayload, S>

  type ChannelCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = 
    Omit<ChannelFindManyArgs, 'select' | 'include' | 'distinct'> & {
      select?: ChannelCountAggregateInputType | true
    }

  export interface ChannelDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['Channel'], meta: { name: 'Channel' } }
    /**
     * Find zero or one Channel that matches the filter.
     * @param {ChannelFindUniqueArgs} args - Arguments to find a Channel
     * @example
     * // Get one Channel
     * const channel = await prisma.channel.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends ChannelFindUniqueArgs>(args: SelectSubset<T, ChannelFindUniqueArgs<ExtArgs>>): Prisma__ChannelClient<$Result.GetResult<Prisma.$ChannelPayload<ExtArgs>, T, "findUnique"> | null, null, ExtArgs>

    /**
     * Find one Channel that matches the filter or throw an error with `error.code='P2025'` 
     * if no matches were found.
     * @param {ChannelFindUniqueOrThrowArgs} args - Arguments to find a Channel
     * @example
     * // Get one Channel
     * const channel = await prisma.channel.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends ChannelFindUniqueOrThrowArgs>(args: SelectSubset<T, ChannelFindUniqueOrThrowArgs<ExtArgs>>): Prisma__ChannelClient<$Result.GetResult<Prisma.$ChannelPayload<ExtArgs>, T, "findUniqueOrThrow">, never, ExtArgs>

    /**
     * Find the first Channel that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ChannelFindFirstArgs} args - Arguments to find a Channel
     * @example
     * // Get one Channel
     * const channel = await prisma.channel.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends ChannelFindFirstArgs>(args?: SelectSubset<T, ChannelFindFirstArgs<ExtArgs>>): Prisma__ChannelClient<$Result.GetResult<Prisma.$ChannelPayload<ExtArgs>, T, "findFirst"> | null, null, ExtArgs>

    /**
     * Find the first Channel that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ChannelFindFirstOrThrowArgs} args - Arguments to find a Channel
     * @example
     * // Get one Channel
     * const channel = await prisma.channel.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends ChannelFindFirstOrThrowArgs>(args?: SelectSubset<T, ChannelFindFirstOrThrowArgs<ExtArgs>>): Prisma__ChannelClient<$Result.GetResult<Prisma.$ChannelPayload<ExtArgs>, T, "findFirstOrThrow">, never, ExtArgs>

    /**
     * Find zero or more Channels that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ChannelFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all Channels
     * const channels = await prisma.channel.findMany()
     * 
     * // Get first 10 Channels
     * const channels = await prisma.channel.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const channelWithIdOnly = await prisma.channel.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends ChannelFindManyArgs>(args?: SelectSubset<T, ChannelFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$ChannelPayload<ExtArgs>, T, "findMany">>

    /**
     * Create a Channel.
     * @param {ChannelCreateArgs} args - Arguments to create a Channel.
     * @example
     * // Create one Channel
     * const Channel = await prisma.channel.create({
     *   data: {
     *     // ... data to create a Channel
     *   }
     * })
     * 
     */
    create<T extends ChannelCreateArgs>(args: SelectSubset<T, ChannelCreateArgs<ExtArgs>>): Prisma__ChannelClient<$Result.GetResult<Prisma.$ChannelPayload<ExtArgs>, T, "create">, never, ExtArgs>

    /**
     * Create many Channels.
     * @param {ChannelCreateManyArgs} args - Arguments to create many Channels.
     * @example
     * // Create many Channels
     * const channel = await prisma.channel.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends ChannelCreateManyArgs>(args?: SelectSubset<T, ChannelCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many Channels and returns the data saved in the database.
     * @param {ChannelCreateManyAndReturnArgs} args - Arguments to create many Channels.
     * @example
     * // Create many Channels
     * const channel = await prisma.channel.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many Channels and only return the `id`
     * const channelWithIdOnly = await prisma.channel.createManyAndReturn({ 
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends ChannelCreateManyAndReturnArgs>(args?: SelectSubset<T, ChannelCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$ChannelPayload<ExtArgs>, T, "createManyAndReturn">>

    /**
     * Delete a Channel.
     * @param {ChannelDeleteArgs} args - Arguments to delete one Channel.
     * @example
     * // Delete one Channel
     * const Channel = await prisma.channel.delete({
     *   where: {
     *     // ... filter to delete one Channel
     *   }
     * })
     * 
     */
    delete<T extends ChannelDeleteArgs>(args: SelectSubset<T, ChannelDeleteArgs<ExtArgs>>): Prisma__ChannelClient<$Result.GetResult<Prisma.$ChannelPayload<ExtArgs>, T, "delete">, never, ExtArgs>

    /**
     * Update one Channel.
     * @param {ChannelUpdateArgs} args - Arguments to update one Channel.
     * @example
     * // Update one Channel
     * const channel = await prisma.channel.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends ChannelUpdateArgs>(args: SelectSubset<T, ChannelUpdateArgs<ExtArgs>>): Prisma__ChannelClient<$Result.GetResult<Prisma.$ChannelPayload<ExtArgs>, T, "update">, never, ExtArgs>

    /**
     * Delete zero or more Channels.
     * @param {ChannelDeleteManyArgs} args - Arguments to filter Channels to delete.
     * @example
     * // Delete a few Channels
     * const { count } = await prisma.channel.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends ChannelDeleteManyArgs>(args?: SelectSubset<T, ChannelDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Channels.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ChannelUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many Channels
     * const channel = await prisma.channel.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends ChannelUpdateManyArgs>(args: SelectSubset<T, ChannelUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create or update one Channel.
     * @param {ChannelUpsertArgs} args - Arguments to update or create a Channel.
     * @example
     * // Update or create a Channel
     * const channel = await prisma.channel.upsert({
     *   create: {
     *     // ... data to create a Channel
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the Channel we want to update
     *   }
     * })
     */
    upsert<T extends ChannelUpsertArgs>(args: SelectSubset<T, ChannelUpsertArgs<ExtArgs>>): Prisma__ChannelClient<$Result.GetResult<Prisma.$ChannelPayload<ExtArgs>, T, "upsert">, never, ExtArgs>


    /**
     * Count the number of Channels.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ChannelCountArgs} args - Arguments to filter Channels to count.
     * @example
     * // Count the number of Channels
     * const count = await prisma.channel.count({
     *   where: {
     *     // ... the filter for the Channels we want to count
     *   }
     * })
    **/
    count<T extends ChannelCountArgs>(
      args?: Subset<T, ChannelCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], ChannelCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a Channel.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ChannelAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends ChannelAggregateArgs>(args: Subset<T, ChannelAggregateArgs>): Prisma.PrismaPromise<GetChannelAggregateType<T>>

    /**
     * Group by Channel.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ChannelGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends ChannelGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: ChannelGroupByArgs['orderBy'] }
        : { orderBy?: ChannelGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, ChannelGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetChannelGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the Channel model
   */
  readonly fields: ChannelFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for Channel.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__ChannelClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    company<T extends CompanyDefaultArgs<ExtArgs> = {}>(args?: Subset<T, CompanyDefaultArgs<ExtArgs>>): Prisma__CompanyClient<$Result.GetResult<Prisma.$CompanyPayload<ExtArgs>, T, "findUniqueOrThrow"> | Null, Null, ExtArgs>
    conversations<T extends Channel$conversationsArgs<ExtArgs> = {}>(args?: Subset<T, Channel$conversationsArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$ConversationPayload<ExtArgs>, T, "findMany"> | Null>
    channel_bots<T extends Channel$channel_botsArgs<ExtArgs> = {}>(args?: Subset<T, Channel$channel_botsArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$ChannelBotPayload<ExtArgs>, T, "findMany"> | Null>
    webhook_events<T extends Channel$webhook_eventsArgs<ExtArgs> = {}>(args?: Subset<T, Channel$webhook_eventsArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$WebhookEventPayload<ExtArgs>, T, "findMany"> | Null>
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the Channel model
   */ 
  interface ChannelFieldRefs {
    readonly id: FieldRef<"Channel", 'String'>
    readonly name: FieldRef<"Channel", 'String'>
    readonly type: FieldRef<"Channel", 'String'>
    readonly status: FieldRef<"Channel", 'String'>
    readonly phone_number: FieldRef<"Channel", 'String'>
    readonly instance_id: FieldRef<"Channel", 'String'>
    readonly api_key: FieldRef<"Channel", 'String'>
    readonly webhook_url: FieldRef<"Channel", 'String'>
    readonly settings: FieldRef<"Channel", 'Json'>
    readonly company_id: FieldRef<"Channel", 'String'>
    readonly created_at: FieldRef<"Channel", 'DateTime'>
    readonly updated_at: FieldRef<"Channel", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * Channel findUnique
   */
  export type ChannelFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Channel
     */
    select?: ChannelSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ChannelInclude<ExtArgs> | null
    /**
     * Filter, which Channel to fetch.
     */
    where: ChannelWhereUniqueInput
  }

  /**
   * Channel findUniqueOrThrow
   */
  export type ChannelFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Channel
     */
    select?: ChannelSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ChannelInclude<ExtArgs> | null
    /**
     * Filter, which Channel to fetch.
     */
    where: ChannelWhereUniqueInput
  }

  /**
   * Channel findFirst
   */
  export type ChannelFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Channel
     */
    select?: ChannelSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ChannelInclude<ExtArgs> | null
    /**
     * Filter, which Channel to fetch.
     */
    where?: ChannelWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Channels to fetch.
     */
    orderBy?: ChannelOrderByWithRelationInput | ChannelOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Channels.
     */
    cursor?: ChannelWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Channels from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Channels.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Channels.
     */
    distinct?: ChannelScalarFieldEnum | ChannelScalarFieldEnum[]
  }

  /**
   * Channel findFirstOrThrow
   */
  export type ChannelFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Channel
     */
    select?: ChannelSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ChannelInclude<ExtArgs> | null
    /**
     * Filter, which Channel to fetch.
     */
    where?: ChannelWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Channels to fetch.
     */
    orderBy?: ChannelOrderByWithRelationInput | ChannelOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Channels.
     */
    cursor?: ChannelWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Channels from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Channels.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Channels.
     */
    distinct?: ChannelScalarFieldEnum | ChannelScalarFieldEnum[]
  }

  /**
   * Channel findMany
   */
  export type ChannelFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Channel
     */
    select?: ChannelSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ChannelInclude<ExtArgs> | null
    /**
     * Filter, which Channels to fetch.
     */
    where?: ChannelWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Channels to fetch.
     */
    orderBy?: ChannelOrderByWithRelationInput | ChannelOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing Channels.
     */
    cursor?: ChannelWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Channels from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Channels.
     */
    skip?: number
    distinct?: ChannelScalarFieldEnum | ChannelScalarFieldEnum[]
  }

  /**
   * Channel create
   */
  export type ChannelCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Channel
     */
    select?: ChannelSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ChannelInclude<ExtArgs> | null
    /**
     * The data needed to create a Channel.
     */
    data: XOR<ChannelCreateInput, ChannelUncheckedCreateInput>
  }

  /**
   * Channel createMany
   */
  export type ChannelCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many Channels.
     */
    data: ChannelCreateManyInput | ChannelCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * Channel createManyAndReturn
   */
  export type ChannelCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Channel
     */
    select?: ChannelSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * The data used to create many Channels.
     */
    data: ChannelCreateManyInput | ChannelCreateManyInput[]
    skipDuplicates?: boolean
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ChannelIncludeCreateManyAndReturn<ExtArgs> | null
  }

  /**
   * Channel update
   */
  export type ChannelUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Channel
     */
    select?: ChannelSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ChannelInclude<ExtArgs> | null
    /**
     * The data needed to update a Channel.
     */
    data: XOR<ChannelUpdateInput, ChannelUncheckedUpdateInput>
    /**
     * Choose, which Channel to update.
     */
    where: ChannelWhereUniqueInput
  }

  /**
   * Channel updateMany
   */
  export type ChannelUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update Channels.
     */
    data: XOR<ChannelUpdateManyMutationInput, ChannelUncheckedUpdateManyInput>
    /**
     * Filter which Channels to update
     */
    where?: ChannelWhereInput
  }

  /**
   * Channel upsert
   */
  export type ChannelUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Channel
     */
    select?: ChannelSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ChannelInclude<ExtArgs> | null
    /**
     * The filter to search for the Channel to update in case it exists.
     */
    where: ChannelWhereUniqueInput
    /**
     * In case the Channel found by the `where` argument doesn't exist, create a new Channel with this data.
     */
    create: XOR<ChannelCreateInput, ChannelUncheckedCreateInput>
    /**
     * In case the Channel was found with the provided `where` argument, update it with this data.
     */
    update: XOR<ChannelUpdateInput, ChannelUncheckedUpdateInput>
  }

  /**
   * Channel delete
   */
  export type ChannelDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Channel
     */
    select?: ChannelSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ChannelInclude<ExtArgs> | null
    /**
     * Filter which Channel to delete.
     */
    where: ChannelWhereUniqueInput
  }

  /**
   * Channel deleteMany
   */
  export type ChannelDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Channels to delete
     */
    where?: ChannelWhereInput
  }

  /**
   * Channel.conversations
   */
  export type Channel$conversationsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Conversation
     */
    select?: ConversationSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ConversationInclude<ExtArgs> | null
    where?: ConversationWhereInput
    orderBy?: ConversationOrderByWithRelationInput | ConversationOrderByWithRelationInput[]
    cursor?: ConversationWhereUniqueInput
    take?: number
    skip?: number
    distinct?: ConversationScalarFieldEnum | ConversationScalarFieldEnum[]
  }

  /**
   * Channel.channel_bots
   */
  export type Channel$channel_botsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ChannelBot
     */
    select?: ChannelBotSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ChannelBotInclude<ExtArgs> | null
    where?: ChannelBotWhereInput
    orderBy?: ChannelBotOrderByWithRelationInput | ChannelBotOrderByWithRelationInput[]
    cursor?: ChannelBotWhereUniqueInput
    take?: number
    skip?: number
    distinct?: ChannelBotScalarFieldEnum | ChannelBotScalarFieldEnum[]
  }

  /**
   * Channel.webhook_events
   */
  export type Channel$webhook_eventsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the WebhookEvent
     */
    select?: WebhookEventSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: WebhookEventInclude<ExtArgs> | null
    where?: WebhookEventWhereInput
    orderBy?: WebhookEventOrderByWithRelationInput | WebhookEventOrderByWithRelationInput[]
    cursor?: WebhookEventWhereUniqueInput
    take?: number
    skip?: number
    distinct?: WebhookEventScalarFieldEnum | WebhookEventScalarFieldEnum[]
  }

  /**
   * Channel without action
   */
  export type ChannelDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Channel
     */
    select?: ChannelSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ChannelInclude<ExtArgs> | null
  }


  /**
   * Model Bot
   */

  export type AggregateBot = {
    _count: BotCountAggregateOutputType | null
    _min: BotMinAggregateOutputType | null
    _max: BotMaxAggregateOutputType | null
  }

  export type BotMinAggregateOutputType = {
    id: string | null
    name: string | null
    description: string | null
    is_active: boolean | null
    company_id: string | null
    created_at: Date | null
    updated_at: Date | null
  }

  export type BotMaxAggregateOutputType = {
    id: string | null
    name: string | null
    description: string | null
    is_active: boolean | null
    company_id: string | null
    created_at: Date | null
    updated_at: Date | null
  }

  export type BotCountAggregateOutputType = {
    id: number
    name: number
    description: number
    is_active: number
    flow_data: number
    company_id: number
    created_at: number
    updated_at: number
    _all: number
  }


  export type BotMinAggregateInputType = {
    id?: true
    name?: true
    description?: true
    is_active?: true
    company_id?: true
    created_at?: true
    updated_at?: true
  }

  export type BotMaxAggregateInputType = {
    id?: true
    name?: true
    description?: true
    is_active?: true
    company_id?: true
    created_at?: true
    updated_at?: true
  }

  export type BotCountAggregateInputType = {
    id?: true
    name?: true
    description?: true
    is_active?: true
    flow_data?: true
    company_id?: true
    created_at?: true
    updated_at?: true
    _all?: true
  }

  export type BotAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Bot to aggregate.
     */
    where?: BotWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Bots to fetch.
     */
    orderBy?: BotOrderByWithRelationInput | BotOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: BotWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Bots from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Bots.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned Bots
    **/
    _count?: true | BotCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: BotMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: BotMaxAggregateInputType
  }

  export type GetBotAggregateType<T extends BotAggregateArgs> = {
        [P in keyof T & keyof AggregateBot]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateBot[P]>
      : GetScalarType<T[P], AggregateBot[P]>
  }




  export type BotGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: BotWhereInput
    orderBy?: BotOrderByWithAggregationInput | BotOrderByWithAggregationInput[]
    by: BotScalarFieldEnum[] | BotScalarFieldEnum
    having?: BotScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: BotCountAggregateInputType | true
    _min?: BotMinAggregateInputType
    _max?: BotMaxAggregateInputType
  }

  export type BotGroupByOutputType = {
    id: string
    name: string
    description: string | null
    is_active: boolean
    flow_data: JsonValue
    company_id: string
    created_at: Date
    updated_at: Date
    _count: BotCountAggregateOutputType | null
    _min: BotMinAggregateOutputType | null
    _max: BotMaxAggregateOutputType | null
  }

  type GetBotGroupByPayload<T extends BotGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<BotGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof BotGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], BotGroupByOutputType[P]>
            : GetScalarType<T[P], BotGroupByOutputType[P]>
        }
      >
    >


  export type BotSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    name?: boolean
    description?: boolean
    is_active?: boolean
    flow_data?: boolean
    company_id?: boolean
    created_at?: boolean
    updated_at?: boolean
    company?: boolean | CompanyDefaultArgs<ExtArgs>
    conversations?: boolean | Bot$conversationsArgs<ExtArgs>
    channel_bots?: boolean | Bot$channel_botsArgs<ExtArgs>
    _count?: boolean | BotCountOutputTypeDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["bot"]>

  export type BotSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    name?: boolean
    description?: boolean
    is_active?: boolean
    flow_data?: boolean
    company_id?: boolean
    created_at?: boolean
    updated_at?: boolean
    company?: boolean | CompanyDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["bot"]>

  export type BotSelectScalar = {
    id?: boolean
    name?: boolean
    description?: boolean
    is_active?: boolean
    flow_data?: boolean
    company_id?: boolean
    created_at?: boolean
    updated_at?: boolean
  }

  export type BotInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    company?: boolean | CompanyDefaultArgs<ExtArgs>
    conversations?: boolean | Bot$conversationsArgs<ExtArgs>
    channel_bots?: boolean | Bot$channel_botsArgs<ExtArgs>
    _count?: boolean | BotCountOutputTypeDefaultArgs<ExtArgs>
  }
  export type BotIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    company?: boolean | CompanyDefaultArgs<ExtArgs>
  }

  export type $BotPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "Bot"
    objects: {
      company: Prisma.$CompanyPayload<ExtArgs>
      conversations: Prisma.$ConversationPayload<ExtArgs>[]
      channel_bots: Prisma.$ChannelBotPayload<ExtArgs>[]
    }
    scalars: $Extensions.GetPayloadResult<{
      id: string
      name: string
      description: string | null
      is_active: boolean
      flow_data: Prisma.JsonValue
      company_id: string
      created_at: Date
      updated_at: Date
    }, ExtArgs["result"]["bot"]>
    composites: {}
  }

  type BotGetPayload<S extends boolean | null | undefined | BotDefaultArgs> = $Result.GetResult<Prisma.$BotPayload, S>

  type BotCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = 
    Omit<BotFindManyArgs, 'select' | 'include' | 'distinct'> & {
      select?: BotCountAggregateInputType | true
    }

  export interface BotDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['Bot'], meta: { name: 'Bot' } }
    /**
     * Find zero or one Bot that matches the filter.
     * @param {BotFindUniqueArgs} args - Arguments to find a Bot
     * @example
     * // Get one Bot
     * const bot = await prisma.bot.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends BotFindUniqueArgs>(args: SelectSubset<T, BotFindUniqueArgs<ExtArgs>>): Prisma__BotClient<$Result.GetResult<Prisma.$BotPayload<ExtArgs>, T, "findUnique"> | null, null, ExtArgs>

    /**
     * Find one Bot that matches the filter or throw an error with `error.code='P2025'` 
     * if no matches were found.
     * @param {BotFindUniqueOrThrowArgs} args - Arguments to find a Bot
     * @example
     * // Get one Bot
     * const bot = await prisma.bot.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends BotFindUniqueOrThrowArgs>(args: SelectSubset<T, BotFindUniqueOrThrowArgs<ExtArgs>>): Prisma__BotClient<$Result.GetResult<Prisma.$BotPayload<ExtArgs>, T, "findUniqueOrThrow">, never, ExtArgs>

    /**
     * Find the first Bot that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {BotFindFirstArgs} args - Arguments to find a Bot
     * @example
     * // Get one Bot
     * const bot = await prisma.bot.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends BotFindFirstArgs>(args?: SelectSubset<T, BotFindFirstArgs<ExtArgs>>): Prisma__BotClient<$Result.GetResult<Prisma.$BotPayload<ExtArgs>, T, "findFirst"> | null, null, ExtArgs>

    /**
     * Find the first Bot that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {BotFindFirstOrThrowArgs} args - Arguments to find a Bot
     * @example
     * // Get one Bot
     * const bot = await prisma.bot.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends BotFindFirstOrThrowArgs>(args?: SelectSubset<T, BotFindFirstOrThrowArgs<ExtArgs>>): Prisma__BotClient<$Result.GetResult<Prisma.$BotPayload<ExtArgs>, T, "findFirstOrThrow">, never, ExtArgs>

    /**
     * Find zero or more Bots that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {BotFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all Bots
     * const bots = await prisma.bot.findMany()
     * 
     * // Get first 10 Bots
     * const bots = await prisma.bot.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const botWithIdOnly = await prisma.bot.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends BotFindManyArgs>(args?: SelectSubset<T, BotFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$BotPayload<ExtArgs>, T, "findMany">>

    /**
     * Create a Bot.
     * @param {BotCreateArgs} args - Arguments to create a Bot.
     * @example
     * // Create one Bot
     * const Bot = await prisma.bot.create({
     *   data: {
     *     // ... data to create a Bot
     *   }
     * })
     * 
     */
    create<T extends BotCreateArgs>(args: SelectSubset<T, BotCreateArgs<ExtArgs>>): Prisma__BotClient<$Result.GetResult<Prisma.$BotPayload<ExtArgs>, T, "create">, never, ExtArgs>

    /**
     * Create many Bots.
     * @param {BotCreateManyArgs} args - Arguments to create many Bots.
     * @example
     * // Create many Bots
     * const bot = await prisma.bot.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends BotCreateManyArgs>(args?: SelectSubset<T, BotCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many Bots and returns the data saved in the database.
     * @param {BotCreateManyAndReturnArgs} args - Arguments to create many Bots.
     * @example
     * // Create many Bots
     * const bot = await prisma.bot.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many Bots and only return the `id`
     * const botWithIdOnly = await prisma.bot.createManyAndReturn({ 
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends BotCreateManyAndReturnArgs>(args?: SelectSubset<T, BotCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$BotPayload<ExtArgs>, T, "createManyAndReturn">>

    /**
     * Delete a Bot.
     * @param {BotDeleteArgs} args - Arguments to delete one Bot.
     * @example
     * // Delete one Bot
     * const Bot = await prisma.bot.delete({
     *   where: {
     *     // ... filter to delete one Bot
     *   }
     * })
     * 
     */
    delete<T extends BotDeleteArgs>(args: SelectSubset<T, BotDeleteArgs<ExtArgs>>): Prisma__BotClient<$Result.GetResult<Prisma.$BotPayload<ExtArgs>, T, "delete">, never, ExtArgs>

    /**
     * Update one Bot.
     * @param {BotUpdateArgs} args - Arguments to update one Bot.
     * @example
     * // Update one Bot
     * const bot = await prisma.bot.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends BotUpdateArgs>(args: SelectSubset<T, BotUpdateArgs<ExtArgs>>): Prisma__BotClient<$Result.GetResult<Prisma.$BotPayload<ExtArgs>, T, "update">, never, ExtArgs>

    /**
     * Delete zero or more Bots.
     * @param {BotDeleteManyArgs} args - Arguments to filter Bots to delete.
     * @example
     * // Delete a few Bots
     * const { count } = await prisma.bot.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends BotDeleteManyArgs>(args?: SelectSubset<T, BotDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Bots.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {BotUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many Bots
     * const bot = await prisma.bot.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends BotUpdateManyArgs>(args: SelectSubset<T, BotUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create or update one Bot.
     * @param {BotUpsertArgs} args - Arguments to update or create a Bot.
     * @example
     * // Update or create a Bot
     * const bot = await prisma.bot.upsert({
     *   create: {
     *     // ... data to create a Bot
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the Bot we want to update
     *   }
     * })
     */
    upsert<T extends BotUpsertArgs>(args: SelectSubset<T, BotUpsertArgs<ExtArgs>>): Prisma__BotClient<$Result.GetResult<Prisma.$BotPayload<ExtArgs>, T, "upsert">, never, ExtArgs>


    /**
     * Count the number of Bots.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {BotCountArgs} args - Arguments to filter Bots to count.
     * @example
     * // Count the number of Bots
     * const count = await prisma.bot.count({
     *   where: {
     *     // ... the filter for the Bots we want to count
     *   }
     * })
    **/
    count<T extends BotCountArgs>(
      args?: Subset<T, BotCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], BotCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a Bot.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {BotAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends BotAggregateArgs>(args: Subset<T, BotAggregateArgs>): Prisma.PrismaPromise<GetBotAggregateType<T>>

    /**
     * Group by Bot.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {BotGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends BotGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: BotGroupByArgs['orderBy'] }
        : { orderBy?: BotGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, BotGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetBotGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the Bot model
   */
  readonly fields: BotFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for Bot.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__BotClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    company<T extends CompanyDefaultArgs<ExtArgs> = {}>(args?: Subset<T, CompanyDefaultArgs<ExtArgs>>): Prisma__CompanyClient<$Result.GetResult<Prisma.$CompanyPayload<ExtArgs>, T, "findUniqueOrThrow"> | Null, Null, ExtArgs>
    conversations<T extends Bot$conversationsArgs<ExtArgs> = {}>(args?: Subset<T, Bot$conversationsArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$ConversationPayload<ExtArgs>, T, "findMany"> | Null>
    channel_bots<T extends Bot$channel_botsArgs<ExtArgs> = {}>(args?: Subset<T, Bot$channel_botsArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$ChannelBotPayload<ExtArgs>, T, "findMany"> | Null>
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the Bot model
   */ 
  interface BotFieldRefs {
    readonly id: FieldRef<"Bot", 'String'>
    readonly name: FieldRef<"Bot", 'String'>
    readonly description: FieldRef<"Bot", 'String'>
    readonly is_active: FieldRef<"Bot", 'Boolean'>
    readonly flow_data: FieldRef<"Bot", 'Json'>
    readonly company_id: FieldRef<"Bot", 'String'>
    readonly created_at: FieldRef<"Bot", 'DateTime'>
    readonly updated_at: FieldRef<"Bot", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * Bot findUnique
   */
  export type BotFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Bot
     */
    select?: BotSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: BotInclude<ExtArgs> | null
    /**
     * Filter, which Bot to fetch.
     */
    where: BotWhereUniqueInput
  }

  /**
   * Bot findUniqueOrThrow
   */
  export type BotFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Bot
     */
    select?: BotSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: BotInclude<ExtArgs> | null
    /**
     * Filter, which Bot to fetch.
     */
    where: BotWhereUniqueInput
  }

  /**
   * Bot findFirst
   */
  export type BotFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Bot
     */
    select?: BotSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: BotInclude<ExtArgs> | null
    /**
     * Filter, which Bot to fetch.
     */
    where?: BotWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Bots to fetch.
     */
    orderBy?: BotOrderByWithRelationInput | BotOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Bots.
     */
    cursor?: BotWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Bots from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Bots.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Bots.
     */
    distinct?: BotScalarFieldEnum | BotScalarFieldEnum[]
  }

  /**
   * Bot findFirstOrThrow
   */
  export type BotFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Bot
     */
    select?: BotSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: BotInclude<ExtArgs> | null
    /**
     * Filter, which Bot to fetch.
     */
    where?: BotWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Bots to fetch.
     */
    orderBy?: BotOrderByWithRelationInput | BotOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Bots.
     */
    cursor?: BotWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Bots from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Bots.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Bots.
     */
    distinct?: BotScalarFieldEnum | BotScalarFieldEnum[]
  }

  /**
   * Bot findMany
   */
  export type BotFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Bot
     */
    select?: BotSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: BotInclude<ExtArgs> | null
    /**
     * Filter, which Bots to fetch.
     */
    where?: BotWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Bots to fetch.
     */
    orderBy?: BotOrderByWithRelationInput | BotOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing Bots.
     */
    cursor?: BotWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Bots from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Bots.
     */
    skip?: number
    distinct?: BotScalarFieldEnum | BotScalarFieldEnum[]
  }

  /**
   * Bot create
   */
  export type BotCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Bot
     */
    select?: BotSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: BotInclude<ExtArgs> | null
    /**
     * The data needed to create a Bot.
     */
    data: XOR<BotCreateInput, BotUncheckedCreateInput>
  }

  /**
   * Bot createMany
   */
  export type BotCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many Bots.
     */
    data: BotCreateManyInput | BotCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * Bot createManyAndReturn
   */
  export type BotCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Bot
     */
    select?: BotSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * The data used to create many Bots.
     */
    data: BotCreateManyInput | BotCreateManyInput[]
    skipDuplicates?: boolean
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: BotIncludeCreateManyAndReturn<ExtArgs> | null
  }

  /**
   * Bot update
   */
  export type BotUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Bot
     */
    select?: BotSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: BotInclude<ExtArgs> | null
    /**
     * The data needed to update a Bot.
     */
    data: XOR<BotUpdateInput, BotUncheckedUpdateInput>
    /**
     * Choose, which Bot to update.
     */
    where: BotWhereUniqueInput
  }

  /**
   * Bot updateMany
   */
  export type BotUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update Bots.
     */
    data: XOR<BotUpdateManyMutationInput, BotUncheckedUpdateManyInput>
    /**
     * Filter which Bots to update
     */
    where?: BotWhereInput
  }

  /**
   * Bot upsert
   */
  export type BotUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Bot
     */
    select?: BotSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: BotInclude<ExtArgs> | null
    /**
     * The filter to search for the Bot to update in case it exists.
     */
    where: BotWhereUniqueInput
    /**
     * In case the Bot found by the `where` argument doesn't exist, create a new Bot with this data.
     */
    create: XOR<BotCreateInput, BotUncheckedCreateInput>
    /**
     * In case the Bot was found with the provided `where` argument, update it with this data.
     */
    update: XOR<BotUpdateInput, BotUncheckedUpdateInput>
  }

  /**
   * Bot delete
   */
  export type BotDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Bot
     */
    select?: BotSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: BotInclude<ExtArgs> | null
    /**
     * Filter which Bot to delete.
     */
    where: BotWhereUniqueInput
  }

  /**
   * Bot deleteMany
   */
  export type BotDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Bots to delete
     */
    where?: BotWhereInput
  }

  /**
   * Bot.conversations
   */
  export type Bot$conversationsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Conversation
     */
    select?: ConversationSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ConversationInclude<ExtArgs> | null
    where?: ConversationWhereInput
    orderBy?: ConversationOrderByWithRelationInput | ConversationOrderByWithRelationInput[]
    cursor?: ConversationWhereUniqueInput
    take?: number
    skip?: number
    distinct?: ConversationScalarFieldEnum | ConversationScalarFieldEnum[]
  }

  /**
   * Bot.channel_bots
   */
  export type Bot$channel_botsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ChannelBot
     */
    select?: ChannelBotSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ChannelBotInclude<ExtArgs> | null
    where?: ChannelBotWhereInput
    orderBy?: ChannelBotOrderByWithRelationInput | ChannelBotOrderByWithRelationInput[]
    cursor?: ChannelBotWhereUniqueInput
    take?: number
    skip?: number
    distinct?: ChannelBotScalarFieldEnum | ChannelBotScalarFieldEnum[]
  }

  /**
   * Bot without action
   */
  export type BotDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Bot
     */
    select?: BotSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: BotInclude<ExtArgs> | null
  }


  /**
   * Model ChannelBot
   */

  export type AggregateChannelBot = {
    _count: ChannelBotCountAggregateOutputType | null
    _min: ChannelBotMinAggregateOutputType | null
    _max: ChannelBotMaxAggregateOutputType | null
  }

  export type ChannelBotMinAggregateOutputType = {
    id: string | null
    channel_id: string | null
    bot_id: string | null
    is_active: boolean | null
    created_at: Date | null
  }

  export type ChannelBotMaxAggregateOutputType = {
    id: string | null
    channel_id: string | null
    bot_id: string | null
    is_active: boolean | null
    created_at: Date | null
  }

  export type ChannelBotCountAggregateOutputType = {
    id: number
    channel_id: number
    bot_id: number
    is_active: number
    trigger_conditions: number
    created_at: number
    _all: number
  }


  export type ChannelBotMinAggregateInputType = {
    id?: true
    channel_id?: true
    bot_id?: true
    is_active?: true
    created_at?: true
  }

  export type ChannelBotMaxAggregateInputType = {
    id?: true
    channel_id?: true
    bot_id?: true
    is_active?: true
    created_at?: true
  }

  export type ChannelBotCountAggregateInputType = {
    id?: true
    channel_id?: true
    bot_id?: true
    is_active?: true
    trigger_conditions?: true
    created_at?: true
    _all?: true
  }

  export type ChannelBotAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which ChannelBot to aggregate.
     */
    where?: ChannelBotWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of ChannelBots to fetch.
     */
    orderBy?: ChannelBotOrderByWithRelationInput | ChannelBotOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: ChannelBotWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` ChannelBots from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` ChannelBots.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned ChannelBots
    **/
    _count?: true | ChannelBotCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: ChannelBotMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: ChannelBotMaxAggregateInputType
  }

  export type GetChannelBotAggregateType<T extends ChannelBotAggregateArgs> = {
        [P in keyof T & keyof AggregateChannelBot]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateChannelBot[P]>
      : GetScalarType<T[P], AggregateChannelBot[P]>
  }




  export type ChannelBotGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: ChannelBotWhereInput
    orderBy?: ChannelBotOrderByWithAggregationInput | ChannelBotOrderByWithAggregationInput[]
    by: ChannelBotScalarFieldEnum[] | ChannelBotScalarFieldEnum
    having?: ChannelBotScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: ChannelBotCountAggregateInputType | true
    _min?: ChannelBotMinAggregateInputType
    _max?: ChannelBotMaxAggregateInputType
  }

  export type ChannelBotGroupByOutputType = {
    id: string
    channel_id: string
    bot_id: string
    is_active: boolean
    trigger_conditions: JsonValue
    created_at: Date
    _count: ChannelBotCountAggregateOutputType | null
    _min: ChannelBotMinAggregateOutputType | null
    _max: ChannelBotMaxAggregateOutputType | null
  }

  type GetChannelBotGroupByPayload<T extends ChannelBotGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<ChannelBotGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof ChannelBotGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], ChannelBotGroupByOutputType[P]>
            : GetScalarType<T[P], ChannelBotGroupByOutputType[P]>
        }
      >
    >


  export type ChannelBotSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    channel_id?: boolean
    bot_id?: boolean
    is_active?: boolean
    trigger_conditions?: boolean
    created_at?: boolean
    channel?: boolean | ChannelDefaultArgs<ExtArgs>
    bot?: boolean | BotDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["channelBot"]>

  export type ChannelBotSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    channel_id?: boolean
    bot_id?: boolean
    is_active?: boolean
    trigger_conditions?: boolean
    created_at?: boolean
    channel?: boolean | ChannelDefaultArgs<ExtArgs>
    bot?: boolean | BotDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["channelBot"]>

  export type ChannelBotSelectScalar = {
    id?: boolean
    channel_id?: boolean
    bot_id?: boolean
    is_active?: boolean
    trigger_conditions?: boolean
    created_at?: boolean
  }

  export type ChannelBotInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    channel?: boolean | ChannelDefaultArgs<ExtArgs>
    bot?: boolean | BotDefaultArgs<ExtArgs>
  }
  export type ChannelBotIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    channel?: boolean | ChannelDefaultArgs<ExtArgs>
    bot?: boolean | BotDefaultArgs<ExtArgs>
  }

  export type $ChannelBotPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "ChannelBot"
    objects: {
      channel: Prisma.$ChannelPayload<ExtArgs>
      bot: Prisma.$BotPayload<ExtArgs>
    }
    scalars: $Extensions.GetPayloadResult<{
      id: string
      channel_id: string
      bot_id: string
      is_active: boolean
      trigger_conditions: Prisma.JsonValue
      created_at: Date
    }, ExtArgs["result"]["channelBot"]>
    composites: {}
  }

  type ChannelBotGetPayload<S extends boolean | null | undefined | ChannelBotDefaultArgs> = $Result.GetResult<Prisma.$ChannelBotPayload, S>

  type ChannelBotCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = 
    Omit<ChannelBotFindManyArgs, 'select' | 'include' | 'distinct'> & {
      select?: ChannelBotCountAggregateInputType | true
    }

  export interface ChannelBotDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['ChannelBot'], meta: { name: 'ChannelBot' } }
    /**
     * Find zero or one ChannelBot that matches the filter.
     * @param {ChannelBotFindUniqueArgs} args - Arguments to find a ChannelBot
     * @example
     * // Get one ChannelBot
     * const channelBot = await prisma.channelBot.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends ChannelBotFindUniqueArgs>(args: SelectSubset<T, ChannelBotFindUniqueArgs<ExtArgs>>): Prisma__ChannelBotClient<$Result.GetResult<Prisma.$ChannelBotPayload<ExtArgs>, T, "findUnique"> | null, null, ExtArgs>

    /**
     * Find one ChannelBot that matches the filter or throw an error with `error.code='P2025'` 
     * if no matches were found.
     * @param {ChannelBotFindUniqueOrThrowArgs} args - Arguments to find a ChannelBot
     * @example
     * // Get one ChannelBot
     * const channelBot = await prisma.channelBot.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends ChannelBotFindUniqueOrThrowArgs>(args: SelectSubset<T, ChannelBotFindUniqueOrThrowArgs<ExtArgs>>): Prisma__ChannelBotClient<$Result.GetResult<Prisma.$ChannelBotPayload<ExtArgs>, T, "findUniqueOrThrow">, never, ExtArgs>

    /**
     * Find the first ChannelBot that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ChannelBotFindFirstArgs} args - Arguments to find a ChannelBot
     * @example
     * // Get one ChannelBot
     * const channelBot = await prisma.channelBot.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends ChannelBotFindFirstArgs>(args?: SelectSubset<T, ChannelBotFindFirstArgs<ExtArgs>>): Prisma__ChannelBotClient<$Result.GetResult<Prisma.$ChannelBotPayload<ExtArgs>, T, "findFirst"> | null, null, ExtArgs>

    /**
     * Find the first ChannelBot that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ChannelBotFindFirstOrThrowArgs} args - Arguments to find a ChannelBot
     * @example
     * // Get one ChannelBot
     * const channelBot = await prisma.channelBot.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends ChannelBotFindFirstOrThrowArgs>(args?: SelectSubset<T, ChannelBotFindFirstOrThrowArgs<ExtArgs>>): Prisma__ChannelBotClient<$Result.GetResult<Prisma.$ChannelBotPayload<ExtArgs>, T, "findFirstOrThrow">, never, ExtArgs>

    /**
     * Find zero or more ChannelBots that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ChannelBotFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all ChannelBots
     * const channelBots = await prisma.channelBot.findMany()
     * 
     * // Get first 10 ChannelBots
     * const channelBots = await prisma.channelBot.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const channelBotWithIdOnly = await prisma.channelBot.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends ChannelBotFindManyArgs>(args?: SelectSubset<T, ChannelBotFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$ChannelBotPayload<ExtArgs>, T, "findMany">>

    /**
     * Create a ChannelBot.
     * @param {ChannelBotCreateArgs} args - Arguments to create a ChannelBot.
     * @example
     * // Create one ChannelBot
     * const ChannelBot = await prisma.channelBot.create({
     *   data: {
     *     // ... data to create a ChannelBot
     *   }
     * })
     * 
     */
    create<T extends ChannelBotCreateArgs>(args: SelectSubset<T, ChannelBotCreateArgs<ExtArgs>>): Prisma__ChannelBotClient<$Result.GetResult<Prisma.$ChannelBotPayload<ExtArgs>, T, "create">, never, ExtArgs>

    /**
     * Create many ChannelBots.
     * @param {ChannelBotCreateManyArgs} args - Arguments to create many ChannelBots.
     * @example
     * // Create many ChannelBots
     * const channelBot = await prisma.channelBot.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends ChannelBotCreateManyArgs>(args?: SelectSubset<T, ChannelBotCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many ChannelBots and returns the data saved in the database.
     * @param {ChannelBotCreateManyAndReturnArgs} args - Arguments to create many ChannelBots.
     * @example
     * // Create many ChannelBots
     * const channelBot = await prisma.channelBot.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many ChannelBots and only return the `id`
     * const channelBotWithIdOnly = await prisma.channelBot.createManyAndReturn({ 
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends ChannelBotCreateManyAndReturnArgs>(args?: SelectSubset<T, ChannelBotCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$ChannelBotPayload<ExtArgs>, T, "createManyAndReturn">>

    /**
     * Delete a ChannelBot.
     * @param {ChannelBotDeleteArgs} args - Arguments to delete one ChannelBot.
     * @example
     * // Delete one ChannelBot
     * const ChannelBot = await prisma.channelBot.delete({
     *   where: {
     *     // ... filter to delete one ChannelBot
     *   }
     * })
     * 
     */
    delete<T extends ChannelBotDeleteArgs>(args: SelectSubset<T, ChannelBotDeleteArgs<ExtArgs>>): Prisma__ChannelBotClient<$Result.GetResult<Prisma.$ChannelBotPayload<ExtArgs>, T, "delete">, never, ExtArgs>

    /**
     * Update one ChannelBot.
     * @param {ChannelBotUpdateArgs} args - Arguments to update one ChannelBot.
     * @example
     * // Update one ChannelBot
     * const channelBot = await prisma.channelBot.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends ChannelBotUpdateArgs>(args: SelectSubset<T, ChannelBotUpdateArgs<ExtArgs>>): Prisma__ChannelBotClient<$Result.GetResult<Prisma.$ChannelBotPayload<ExtArgs>, T, "update">, never, ExtArgs>

    /**
     * Delete zero or more ChannelBots.
     * @param {ChannelBotDeleteManyArgs} args - Arguments to filter ChannelBots to delete.
     * @example
     * // Delete a few ChannelBots
     * const { count } = await prisma.channelBot.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends ChannelBotDeleteManyArgs>(args?: SelectSubset<T, ChannelBotDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more ChannelBots.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ChannelBotUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many ChannelBots
     * const channelBot = await prisma.channelBot.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends ChannelBotUpdateManyArgs>(args: SelectSubset<T, ChannelBotUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create or update one ChannelBot.
     * @param {ChannelBotUpsertArgs} args - Arguments to update or create a ChannelBot.
     * @example
     * // Update or create a ChannelBot
     * const channelBot = await prisma.channelBot.upsert({
     *   create: {
     *     // ... data to create a ChannelBot
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the ChannelBot we want to update
     *   }
     * })
     */
    upsert<T extends ChannelBotUpsertArgs>(args: SelectSubset<T, ChannelBotUpsertArgs<ExtArgs>>): Prisma__ChannelBotClient<$Result.GetResult<Prisma.$ChannelBotPayload<ExtArgs>, T, "upsert">, never, ExtArgs>


    /**
     * Count the number of ChannelBots.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ChannelBotCountArgs} args - Arguments to filter ChannelBots to count.
     * @example
     * // Count the number of ChannelBots
     * const count = await prisma.channelBot.count({
     *   where: {
     *     // ... the filter for the ChannelBots we want to count
     *   }
     * })
    **/
    count<T extends ChannelBotCountArgs>(
      args?: Subset<T, ChannelBotCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], ChannelBotCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a ChannelBot.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ChannelBotAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends ChannelBotAggregateArgs>(args: Subset<T, ChannelBotAggregateArgs>): Prisma.PrismaPromise<GetChannelBotAggregateType<T>>

    /**
     * Group by ChannelBot.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ChannelBotGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends ChannelBotGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: ChannelBotGroupByArgs['orderBy'] }
        : { orderBy?: ChannelBotGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, ChannelBotGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetChannelBotGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the ChannelBot model
   */
  readonly fields: ChannelBotFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for ChannelBot.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__ChannelBotClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    channel<T extends ChannelDefaultArgs<ExtArgs> = {}>(args?: Subset<T, ChannelDefaultArgs<ExtArgs>>): Prisma__ChannelClient<$Result.GetResult<Prisma.$ChannelPayload<ExtArgs>, T, "findUniqueOrThrow"> | Null, Null, ExtArgs>
    bot<T extends BotDefaultArgs<ExtArgs> = {}>(args?: Subset<T, BotDefaultArgs<ExtArgs>>): Prisma__BotClient<$Result.GetResult<Prisma.$BotPayload<ExtArgs>, T, "findUniqueOrThrow"> | Null, Null, ExtArgs>
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the ChannelBot model
   */ 
  interface ChannelBotFieldRefs {
    readonly id: FieldRef<"ChannelBot", 'String'>
    readonly channel_id: FieldRef<"ChannelBot", 'String'>
    readonly bot_id: FieldRef<"ChannelBot", 'String'>
    readonly is_active: FieldRef<"ChannelBot", 'Boolean'>
    readonly trigger_conditions: FieldRef<"ChannelBot", 'Json'>
    readonly created_at: FieldRef<"ChannelBot", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * ChannelBot findUnique
   */
  export type ChannelBotFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ChannelBot
     */
    select?: ChannelBotSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ChannelBotInclude<ExtArgs> | null
    /**
     * Filter, which ChannelBot to fetch.
     */
    where: ChannelBotWhereUniqueInput
  }

  /**
   * ChannelBot findUniqueOrThrow
   */
  export type ChannelBotFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ChannelBot
     */
    select?: ChannelBotSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ChannelBotInclude<ExtArgs> | null
    /**
     * Filter, which ChannelBot to fetch.
     */
    where: ChannelBotWhereUniqueInput
  }

  /**
   * ChannelBot findFirst
   */
  export type ChannelBotFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ChannelBot
     */
    select?: ChannelBotSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ChannelBotInclude<ExtArgs> | null
    /**
     * Filter, which ChannelBot to fetch.
     */
    where?: ChannelBotWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of ChannelBots to fetch.
     */
    orderBy?: ChannelBotOrderByWithRelationInput | ChannelBotOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for ChannelBots.
     */
    cursor?: ChannelBotWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` ChannelBots from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` ChannelBots.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of ChannelBots.
     */
    distinct?: ChannelBotScalarFieldEnum | ChannelBotScalarFieldEnum[]
  }

  /**
   * ChannelBot findFirstOrThrow
   */
  export type ChannelBotFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ChannelBot
     */
    select?: ChannelBotSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ChannelBotInclude<ExtArgs> | null
    /**
     * Filter, which ChannelBot to fetch.
     */
    where?: ChannelBotWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of ChannelBots to fetch.
     */
    orderBy?: ChannelBotOrderByWithRelationInput | ChannelBotOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for ChannelBots.
     */
    cursor?: ChannelBotWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` ChannelBots from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` ChannelBots.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of ChannelBots.
     */
    distinct?: ChannelBotScalarFieldEnum | ChannelBotScalarFieldEnum[]
  }

  /**
   * ChannelBot findMany
   */
  export type ChannelBotFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ChannelBot
     */
    select?: ChannelBotSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ChannelBotInclude<ExtArgs> | null
    /**
     * Filter, which ChannelBots to fetch.
     */
    where?: ChannelBotWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of ChannelBots to fetch.
     */
    orderBy?: ChannelBotOrderByWithRelationInput | ChannelBotOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing ChannelBots.
     */
    cursor?: ChannelBotWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` ChannelBots from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` ChannelBots.
     */
    skip?: number
    distinct?: ChannelBotScalarFieldEnum | ChannelBotScalarFieldEnum[]
  }

  /**
   * ChannelBot create
   */
  export type ChannelBotCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ChannelBot
     */
    select?: ChannelBotSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ChannelBotInclude<ExtArgs> | null
    /**
     * The data needed to create a ChannelBot.
     */
    data: XOR<ChannelBotCreateInput, ChannelBotUncheckedCreateInput>
  }

  /**
   * ChannelBot createMany
   */
  export type ChannelBotCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many ChannelBots.
     */
    data: ChannelBotCreateManyInput | ChannelBotCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * ChannelBot createManyAndReturn
   */
  export type ChannelBotCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ChannelBot
     */
    select?: ChannelBotSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * The data used to create many ChannelBots.
     */
    data: ChannelBotCreateManyInput | ChannelBotCreateManyInput[]
    skipDuplicates?: boolean
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ChannelBotIncludeCreateManyAndReturn<ExtArgs> | null
  }

  /**
   * ChannelBot update
   */
  export type ChannelBotUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ChannelBot
     */
    select?: ChannelBotSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ChannelBotInclude<ExtArgs> | null
    /**
     * The data needed to update a ChannelBot.
     */
    data: XOR<ChannelBotUpdateInput, ChannelBotUncheckedUpdateInput>
    /**
     * Choose, which ChannelBot to update.
     */
    where: ChannelBotWhereUniqueInput
  }

  /**
   * ChannelBot updateMany
   */
  export type ChannelBotUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update ChannelBots.
     */
    data: XOR<ChannelBotUpdateManyMutationInput, ChannelBotUncheckedUpdateManyInput>
    /**
     * Filter which ChannelBots to update
     */
    where?: ChannelBotWhereInput
  }

  /**
   * ChannelBot upsert
   */
  export type ChannelBotUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ChannelBot
     */
    select?: ChannelBotSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ChannelBotInclude<ExtArgs> | null
    /**
     * The filter to search for the ChannelBot to update in case it exists.
     */
    where: ChannelBotWhereUniqueInput
    /**
     * In case the ChannelBot found by the `where` argument doesn't exist, create a new ChannelBot with this data.
     */
    create: XOR<ChannelBotCreateInput, ChannelBotUncheckedCreateInput>
    /**
     * In case the ChannelBot was found with the provided `where` argument, update it with this data.
     */
    update: XOR<ChannelBotUpdateInput, ChannelBotUncheckedUpdateInput>
  }

  /**
   * ChannelBot delete
   */
  export type ChannelBotDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ChannelBot
     */
    select?: ChannelBotSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ChannelBotInclude<ExtArgs> | null
    /**
     * Filter which ChannelBot to delete.
     */
    where: ChannelBotWhereUniqueInput
  }

  /**
   * ChannelBot deleteMany
   */
  export type ChannelBotDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which ChannelBots to delete
     */
    where?: ChannelBotWhereInput
  }

  /**
   * ChannelBot without action
   */
  export type ChannelBotDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ChannelBot
     */
    select?: ChannelBotSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ChannelBotInclude<ExtArgs> | null
  }


  /**
   * Model Contact
   */

  export type AggregateContact = {
    _count: ContactCountAggregateOutputType | null
    _min: ContactMinAggregateOutputType | null
    _max: ContactMaxAggregateOutputType | null
  }

  export type ContactMinAggregateOutputType = {
    id: string | null
    name: string | null
    phone: string | null
    email: string | null
    avatar_url: string | null
    company_id: string | null
    created_at: Date | null
    updated_at: Date | null
  }

  export type ContactMaxAggregateOutputType = {
    id: string | null
    name: string | null
    phone: string | null
    email: string | null
    avatar_url: string | null
    company_id: string | null
    created_at: Date | null
    updated_at: Date | null
  }

  export type ContactCountAggregateOutputType = {
    id: number
    name: number
    phone: number
    email: number
    avatar_url: number
    metadata: number
    company_id: number
    created_at: number
    updated_at: number
    _all: number
  }


  export type ContactMinAggregateInputType = {
    id?: true
    name?: true
    phone?: true
    email?: true
    avatar_url?: true
    company_id?: true
    created_at?: true
    updated_at?: true
  }

  export type ContactMaxAggregateInputType = {
    id?: true
    name?: true
    phone?: true
    email?: true
    avatar_url?: true
    company_id?: true
    created_at?: true
    updated_at?: true
  }

  export type ContactCountAggregateInputType = {
    id?: true
    name?: true
    phone?: true
    email?: true
    avatar_url?: true
    metadata?: true
    company_id?: true
    created_at?: true
    updated_at?: true
    _all?: true
  }

  export type ContactAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Contact to aggregate.
     */
    where?: ContactWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Contacts to fetch.
     */
    orderBy?: ContactOrderByWithRelationInput | ContactOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: ContactWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Contacts from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Contacts.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned Contacts
    **/
    _count?: true | ContactCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: ContactMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: ContactMaxAggregateInputType
  }

  export type GetContactAggregateType<T extends ContactAggregateArgs> = {
        [P in keyof T & keyof AggregateContact]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateContact[P]>
      : GetScalarType<T[P], AggregateContact[P]>
  }




  export type ContactGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: ContactWhereInput
    orderBy?: ContactOrderByWithAggregationInput | ContactOrderByWithAggregationInput[]
    by: ContactScalarFieldEnum[] | ContactScalarFieldEnum
    having?: ContactScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: ContactCountAggregateInputType | true
    _min?: ContactMinAggregateInputType
    _max?: ContactMaxAggregateInputType
  }

  export type ContactGroupByOutputType = {
    id: string
    name: string | null
    phone: string
    email: string | null
    avatar_url: string | null
    metadata: JsonValue
    company_id: string
    created_at: Date
    updated_at: Date
    _count: ContactCountAggregateOutputType | null
    _min: ContactMinAggregateOutputType | null
    _max: ContactMaxAggregateOutputType | null
  }

  type GetContactGroupByPayload<T extends ContactGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<ContactGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof ContactGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], ContactGroupByOutputType[P]>
            : GetScalarType<T[P], ContactGroupByOutputType[P]>
        }
      >
    >


  export type ContactSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    name?: boolean
    phone?: boolean
    email?: boolean
    avatar_url?: boolean
    metadata?: boolean
    company_id?: boolean
    created_at?: boolean
    updated_at?: boolean
    company?: boolean | CompanyDefaultArgs<ExtArgs>
    conversations?: boolean | Contact$conversationsArgs<ExtArgs>
    _count?: boolean | ContactCountOutputTypeDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["contact"]>

  export type ContactSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    name?: boolean
    phone?: boolean
    email?: boolean
    avatar_url?: boolean
    metadata?: boolean
    company_id?: boolean
    created_at?: boolean
    updated_at?: boolean
    company?: boolean | CompanyDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["contact"]>

  export type ContactSelectScalar = {
    id?: boolean
    name?: boolean
    phone?: boolean
    email?: boolean
    avatar_url?: boolean
    metadata?: boolean
    company_id?: boolean
    created_at?: boolean
    updated_at?: boolean
  }

  export type ContactInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    company?: boolean | CompanyDefaultArgs<ExtArgs>
    conversations?: boolean | Contact$conversationsArgs<ExtArgs>
    _count?: boolean | ContactCountOutputTypeDefaultArgs<ExtArgs>
  }
  export type ContactIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    company?: boolean | CompanyDefaultArgs<ExtArgs>
  }

  export type $ContactPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "Contact"
    objects: {
      company: Prisma.$CompanyPayload<ExtArgs>
      conversations: Prisma.$ConversationPayload<ExtArgs>[]
    }
    scalars: $Extensions.GetPayloadResult<{
      id: string
      name: string | null
      phone: string
      email: string | null
      avatar_url: string | null
      metadata: Prisma.JsonValue
      company_id: string
      created_at: Date
      updated_at: Date
    }, ExtArgs["result"]["contact"]>
    composites: {}
  }

  type ContactGetPayload<S extends boolean | null | undefined | ContactDefaultArgs> = $Result.GetResult<Prisma.$ContactPayload, S>

  type ContactCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = 
    Omit<ContactFindManyArgs, 'select' | 'include' | 'distinct'> & {
      select?: ContactCountAggregateInputType | true
    }

  export interface ContactDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['Contact'], meta: { name: 'Contact' } }
    /**
     * Find zero or one Contact that matches the filter.
     * @param {ContactFindUniqueArgs} args - Arguments to find a Contact
     * @example
     * // Get one Contact
     * const contact = await prisma.contact.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends ContactFindUniqueArgs>(args: SelectSubset<T, ContactFindUniqueArgs<ExtArgs>>): Prisma__ContactClient<$Result.GetResult<Prisma.$ContactPayload<ExtArgs>, T, "findUnique"> | null, null, ExtArgs>

    /**
     * Find one Contact that matches the filter or throw an error with `error.code='P2025'` 
     * if no matches were found.
     * @param {ContactFindUniqueOrThrowArgs} args - Arguments to find a Contact
     * @example
     * // Get one Contact
     * const contact = await prisma.contact.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends ContactFindUniqueOrThrowArgs>(args: SelectSubset<T, ContactFindUniqueOrThrowArgs<ExtArgs>>): Prisma__ContactClient<$Result.GetResult<Prisma.$ContactPayload<ExtArgs>, T, "findUniqueOrThrow">, never, ExtArgs>

    /**
     * Find the first Contact that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ContactFindFirstArgs} args - Arguments to find a Contact
     * @example
     * // Get one Contact
     * const contact = await prisma.contact.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends ContactFindFirstArgs>(args?: SelectSubset<T, ContactFindFirstArgs<ExtArgs>>): Prisma__ContactClient<$Result.GetResult<Prisma.$ContactPayload<ExtArgs>, T, "findFirst"> | null, null, ExtArgs>

    /**
     * Find the first Contact that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ContactFindFirstOrThrowArgs} args - Arguments to find a Contact
     * @example
     * // Get one Contact
     * const contact = await prisma.contact.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends ContactFindFirstOrThrowArgs>(args?: SelectSubset<T, ContactFindFirstOrThrowArgs<ExtArgs>>): Prisma__ContactClient<$Result.GetResult<Prisma.$ContactPayload<ExtArgs>, T, "findFirstOrThrow">, never, ExtArgs>

    /**
     * Find zero or more Contacts that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ContactFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all Contacts
     * const contacts = await prisma.contact.findMany()
     * 
     * // Get first 10 Contacts
     * const contacts = await prisma.contact.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const contactWithIdOnly = await prisma.contact.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends ContactFindManyArgs>(args?: SelectSubset<T, ContactFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$ContactPayload<ExtArgs>, T, "findMany">>

    /**
     * Create a Contact.
     * @param {ContactCreateArgs} args - Arguments to create a Contact.
     * @example
     * // Create one Contact
     * const Contact = await prisma.contact.create({
     *   data: {
     *     // ... data to create a Contact
     *   }
     * })
     * 
     */
    create<T extends ContactCreateArgs>(args: SelectSubset<T, ContactCreateArgs<ExtArgs>>): Prisma__ContactClient<$Result.GetResult<Prisma.$ContactPayload<ExtArgs>, T, "create">, never, ExtArgs>

    /**
     * Create many Contacts.
     * @param {ContactCreateManyArgs} args - Arguments to create many Contacts.
     * @example
     * // Create many Contacts
     * const contact = await prisma.contact.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends ContactCreateManyArgs>(args?: SelectSubset<T, ContactCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many Contacts and returns the data saved in the database.
     * @param {ContactCreateManyAndReturnArgs} args - Arguments to create many Contacts.
     * @example
     * // Create many Contacts
     * const contact = await prisma.contact.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many Contacts and only return the `id`
     * const contactWithIdOnly = await prisma.contact.createManyAndReturn({ 
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends ContactCreateManyAndReturnArgs>(args?: SelectSubset<T, ContactCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$ContactPayload<ExtArgs>, T, "createManyAndReturn">>

    /**
     * Delete a Contact.
     * @param {ContactDeleteArgs} args - Arguments to delete one Contact.
     * @example
     * // Delete one Contact
     * const Contact = await prisma.contact.delete({
     *   where: {
     *     // ... filter to delete one Contact
     *   }
     * })
     * 
     */
    delete<T extends ContactDeleteArgs>(args: SelectSubset<T, ContactDeleteArgs<ExtArgs>>): Prisma__ContactClient<$Result.GetResult<Prisma.$ContactPayload<ExtArgs>, T, "delete">, never, ExtArgs>

    /**
     * Update one Contact.
     * @param {ContactUpdateArgs} args - Arguments to update one Contact.
     * @example
     * // Update one Contact
     * const contact = await prisma.contact.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends ContactUpdateArgs>(args: SelectSubset<T, ContactUpdateArgs<ExtArgs>>): Prisma__ContactClient<$Result.GetResult<Prisma.$ContactPayload<ExtArgs>, T, "update">, never, ExtArgs>

    /**
     * Delete zero or more Contacts.
     * @param {ContactDeleteManyArgs} args - Arguments to filter Contacts to delete.
     * @example
     * // Delete a few Contacts
     * const { count } = await prisma.contact.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends ContactDeleteManyArgs>(args?: SelectSubset<T, ContactDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Contacts.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ContactUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many Contacts
     * const contact = await prisma.contact.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends ContactUpdateManyArgs>(args: SelectSubset<T, ContactUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create or update one Contact.
     * @param {ContactUpsertArgs} args - Arguments to update or create a Contact.
     * @example
     * // Update or create a Contact
     * const contact = await prisma.contact.upsert({
     *   create: {
     *     // ... data to create a Contact
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the Contact we want to update
     *   }
     * })
     */
    upsert<T extends ContactUpsertArgs>(args: SelectSubset<T, ContactUpsertArgs<ExtArgs>>): Prisma__ContactClient<$Result.GetResult<Prisma.$ContactPayload<ExtArgs>, T, "upsert">, never, ExtArgs>


    /**
     * Count the number of Contacts.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ContactCountArgs} args - Arguments to filter Contacts to count.
     * @example
     * // Count the number of Contacts
     * const count = await prisma.contact.count({
     *   where: {
     *     // ... the filter for the Contacts we want to count
     *   }
     * })
    **/
    count<T extends ContactCountArgs>(
      args?: Subset<T, ContactCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], ContactCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a Contact.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ContactAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends ContactAggregateArgs>(args: Subset<T, ContactAggregateArgs>): Prisma.PrismaPromise<GetContactAggregateType<T>>

    /**
     * Group by Contact.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ContactGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends ContactGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: ContactGroupByArgs['orderBy'] }
        : { orderBy?: ContactGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, ContactGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetContactGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the Contact model
   */
  readonly fields: ContactFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for Contact.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__ContactClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    company<T extends CompanyDefaultArgs<ExtArgs> = {}>(args?: Subset<T, CompanyDefaultArgs<ExtArgs>>): Prisma__CompanyClient<$Result.GetResult<Prisma.$CompanyPayload<ExtArgs>, T, "findUniqueOrThrow"> | Null, Null, ExtArgs>
    conversations<T extends Contact$conversationsArgs<ExtArgs> = {}>(args?: Subset<T, Contact$conversationsArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$ConversationPayload<ExtArgs>, T, "findMany"> | Null>
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the Contact model
   */ 
  interface ContactFieldRefs {
    readonly id: FieldRef<"Contact", 'String'>
    readonly name: FieldRef<"Contact", 'String'>
    readonly phone: FieldRef<"Contact", 'String'>
    readonly email: FieldRef<"Contact", 'String'>
    readonly avatar_url: FieldRef<"Contact", 'String'>
    readonly metadata: FieldRef<"Contact", 'Json'>
    readonly company_id: FieldRef<"Contact", 'String'>
    readonly created_at: FieldRef<"Contact", 'DateTime'>
    readonly updated_at: FieldRef<"Contact", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * Contact findUnique
   */
  export type ContactFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Contact
     */
    select?: ContactSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ContactInclude<ExtArgs> | null
    /**
     * Filter, which Contact to fetch.
     */
    where: ContactWhereUniqueInput
  }

  /**
   * Contact findUniqueOrThrow
   */
  export type ContactFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Contact
     */
    select?: ContactSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ContactInclude<ExtArgs> | null
    /**
     * Filter, which Contact to fetch.
     */
    where: ContactWhereUniqueInput
  }

  /**
   * Contact findFirst
   */
  export type ContactFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Contact
     */
    select?: ContactSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ContactInclude<ExtArgs> | null
    /**
     * Filter, which Contact to fetch.
     */
    where?: ContactWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Contacts to fetch.
     */
    orderBy?: ContactOrderByWithRelationInput | ContactOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Contacts.
     */
    cursor?: ContactWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Contacts from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Contacts.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Contacts.
     */
    distinct?: ContactScalarFieldEnum | ContactScalarFieldEnum[]
  }

  /**
   * Contact findFirstOrThrow
   */
  export type ContactFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Contact
     */
    select?: ContactSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ContactInclude<ExtArgs> | null
    /**
     * Filter, which Contact to fetch.
     */
    where?: ContactWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Contacts to fetch.
     */
    orderBy?: ContactOrderByWithRelationInput | ContactOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Contacts.
     */
    cursor?: ContactWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Contacts from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Contacts.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Contacts.
     */
    distinct?: ContactScalarFieldEnum | ContactScalarFieldEnum[]
  }

  /**
   * Contact findMany
   */
  export type ContactFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Contact
     */
    select?: ContactSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ContactInclude<ExtArgs> | null
    /**
     * Filter, which Contacts to fetch.
     */
    where?: ContactWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Contacts to fetch.
     */
    orderBy?: ContactOrderByWithRelationInput | ContactOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing Contacts.
     */
    cursor?: ContactWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Contacts from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Contacts.
     */
    skip?: number
    distinct?: ContactScalarFieldEnum | ContactScalarFieldEnum[]
  }

  /**
   * Contact create
   */
  export type ContactCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Contact
     */
    select?: ContactSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ContactInclude<ExtArgs> | null
    /**
     * The data needed to create a Contact.
     */
    data: XOR<ContactCreateInput, ContactUncheckedCreateInput>
  }

  /**
   * Contact createMany
   */
  export type ContactCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many Contacts.
     */
    data: ContactCreateManyInput | ContactCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * Contact createManyAndReturn
   */
  export type ContactCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Contact
     */
    select?: ContactSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * The data used to create many Contacts.
     */
    data: ContactCreateManyInput | ContactCreateManyInput[]
    skipDuplicates?: boolean
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ContactIncludeCreateManyAndReturn<ExtArgs> | null
  }

  /**
   * Contact update
   */
  export type ContactUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Contact
     */
    select?: ContactSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ContactInclude<ExtArgs> | null
    /**
     * The data needed to update a Contact.
     */
    data: XOR<ContactUpdateInput, ContactUncheckedUpdateInput>
    /**
     * Choose, which Contact to update.
     */
    where: ContactWhereUniqueInput
  }

  /**
   * Contact updateMany
   */
  export type ContactUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update Contacts.
     */
    data: XOR<ContactUpdateManyMutationInput, ContactUncheckedUpdateManyInput>
    /**
     * Filter which Contacts to update
     */
    where?: ContactWhereInput
  }

  /**
   * Contact upsert
   */
  export type ContactUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Contact
     */
    select?: ContactSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ContactInclude<ExtArgs> | null
    /**
     * The filter to search for the Contact to update in case it exists.
     */
    where: ContactWhereUniqueInput
    /**
     * In case the Contact found by the `where` argument doesn't exist, create a new Contact with this data.
     */
    create: XOR<ContactCreateInput, ContactUncheckedCreateInput>
    /**
     * In case the Contact was found with the provided `where` argument, update it with this data.
     */
    update: XOR<ContactUpdateInput, ContactUncheckedUpdateInput>
  }

  /**
   * Contact delete
   */
  export type ContactDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Contact
     */
    select?: ContactSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ContactInclude<ExtArgs> | null
    /**
     * Filter which Contact to delete.
     */
    where: ContactWhereUniqueInput
  }

  /**
   * Contact deleteMany
   */
  export type ContactDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Contacts to delete
     */
    where?: ContactWhereInput
  }

  /**
   * Contact.conversations
   */
  export type Contact$conversationsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Conversation
     */
    select?: ConversationSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ConversationInclude<ExtArgs> | null
    where?: ConversationWhereInput
    orderBy?: ConversationOrderByWithRelationInput | ConversationOrderByWithRelationInput[]
    cursor?: ConversationWhereUniqueInput
    take?: number
    skip?: number
    distinct?: ConversationScalarFieldEnum | ConversationScalarFieldEnum[]
  }

  /**
   * Contact without action
   */
  export type ContactDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Contact
     */
    select?: ContactSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ContactInclude<ExtArgs> | null
  }


  /**
   * Model Conversation
   */

  export type AggregateConversation = {
    _count: ConversationCountAggregateOutputType | null
    _min: ConversationMinAggregateOutputType | null
    _max: ConversationMaxAggregateOutputType | null
  }

  export type ConversationMinAggregateOutputType = {
    id: string | null
    contact_id: string | null
    channel_id: string | null
    bot_id: string | null
    status: string | null
    assigned_to: string | null
    last_message_at: Date | null
    company_id: string | null
    created_at: Date | null
    updated_at: Date | null
  }

  export type ConversationMaxAggregateOutputType = {
    id: string | null
    contact_id: string | null
    channel_id: string | null
    bot_id: string | null
    status: string | null
    assigned_to: string | null
    last_message_at: Date | null
    company_id: string | null
    created_at: Date | null
    updated_at: Date | null
  }

  export type ConversationCountAggregateOutputType = {
    id: number
    contact_id: number
    channel_id: number
    bot_id: number
    status: number
    assigned_to: number
    last_message_at: number
    company_id: number
    metadata: number
    created_at: number
    updated_at: number
    _all: number
  }


  export type ConversationMinAggregateInputType = {
    id?: true
    contact_id?: true
    channel_id?: true
    bot_id?: true
    status?: true
    assigned_to?: true
    last_message_at?: true
    company_id?: true
    created_at?: true
    updated_at?: true
  }

  export type ConversationMaxAggregateInputType = {
    id?: true
    contact_id?: true
    channel_id?: true
    bot_id?: true
    status?: true
    assigned_to?: true
    last_message_at?: true
    company_id?: true
    created_at?: true
    updated_at?: true
  }

  export type ConversationCountAggregateInputType = {
    id?: true
    contact_id?: true
    channel_id?: true
    bot_id?: true
    status?: true
    assigned_to?: true
    last_message_at?: true
    company_id?: true
    metadata?: true
    created_at?: true
    updated_at?: true
    _all?: true
  }

  export type ConversationAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Conversation to aggregate.
     */
    where?: ConversationWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Conversations to fetch.
     */
    orderBy?: ConversationOrderByWithRelationInput | ConversationOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: ConversationWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Conversations from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Conversations.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned Conversations
    **/
    _count?: true | ConversationCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: ConversationMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: ConversationMaxAggregateInputType
  }

  export type GetConversationAggregateType<T extends ConversationAggregateArgs> = {
        [P in keyof T & keyof AggregateConversation]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateConversation[P]>
      : GetScalarType<T[P], AggregateConversation[P]>
  }




  export type ConversationGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: ConversationWhereInput
    orderBy?: ConversationOrderByWithAggregationInput | ConversationOrderByWithAggregationInput[]
    by: ConversationScalarFieldEnum[] | ConversationScalarFieldEnum
    having?: ConversationScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: ConversationCountAggregateInputType | true
    _min?: ConversationMinAggregateInputType
    _max?: ConversationMaxAggregateInputType
  }

  export type ConversationGroupByOutputType = {
    id: string
    contact_id: string
    channel_id: string
    bot_id: string | null
    status: string
    assigned_to: string | null
    last_message_at: Date
    company_id: string
    metadata: JsonValue
    created_at: Date
    updated_at: Date
    _count: ConversationCountAggregateOutputType | null
    _min: ConversationMinAggregateOutputType | null
    _max: ConversationMaxAggregateOutputType | null
  }

  type GetConversationGroupByPayload<T extends ConversationGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<ConversationGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof ConversationGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], ConversationGroupByOutputType[P]>
            : GetScalarType<T[P], ConversationGroupByOutputType[P]>
        }
      >
    >


  export type ConversationSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    contact_id?: boolean
    channel_id?: boolean
    bot_id?: boolean
    status?: boolean
    assigned_to?: boolean
    last_message_at?: boolean
    company_id?: boolean
    metadata?: boolean
    created_at?: boolean
    updated_at?: boolean
    contact?: boolean | ContactDefaultArgs<ExtArgs>
    channel?: boolean | ChannelDefaultArgs<ExtArgs>
    bot?: boolean | Conversation$botArgs<ExtArgs>
    assigned_user?: boolean | Conversation$assigned_userArgs<ExtArgs>
    company?: boolean | CompanyDefaultArgs<ExtArgs>
    messages?: boolean | Conversation$messagesArgs<ExtArgs>
    tickets?: boolean | Conversation$ticketsArgs<ExtArgs>
    _count?: boolean | ConversationCountOutputTypeDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["conversation"]>

  export type ConversationSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    contact_id?: boolean
    channel_id?: boolean
    bot_id?: boolean
    status?: boolean
    assigned_to?: boolean
    last_message_at?: boolean
    company_id?: boolean
    metadata?: boolean
    created_at?: boolean
    updated_at?: boolean
    contact?: boolean | ContactDefaultArgs<ExtArgs>
    channel?: boolean | ChannelDefaultArgs<ExtArgs>
    bot?: boolean | Conversation$botArgs<ExtArgs>
    assigned_user?: boolean | Conversation$assigned_userArgs<ExtArgs>
    company?: boolean | CompanyDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["conversation"]>

  export type ConversationSelectScalar = {
    id?: boolean
    contact_id?: boolean
    channel_id?: boolean
    bot_id?: boolean
    status?: boolean
    assigned_to?: boolean
    last_message_at?: boolean
    company_id?: boolean
    metadata?: boolean
    created_at?: boolean
    updated_at?: boolean
  }

  export type ConversationInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    contact?: boolean | ContactDefaultArgs<ExtArgs>
    channel?: boolean | ChannelDefaultArgs<ExtArgs>
    bot?: boolean | Conversation$botArgs<ExtArgs>
    assigned_user?: boolean | Conversation$assigned_userArgs<ExtArgs>
    company?: boolean | CompanyDefaultArgs<ExtArgs>
    messages?: boolean | Conversation$messagesArgs<ExtArgs>
    tickets?: boolean | Conversation$ticketsArgs<ExtArgs>
    _count?: boolean | ConversationCountOutputTypeDefaultArgs<ExtArgs>
  }
  export type ConversationIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    contact?: boolean | ContactDefaultArgs<ExtArgs>
    channel?: boolean | ChannelDefaultArgs<ExtArgs>
    bot?: boolean | Conversation$botArgs<ExtArgs>
    assigned_user?: boolean | Conversation$assigned_userArgs<ExtArgs>
    company?: boolean | CompanyDefaultArgs<ExtArgs>
  }

  export type $ConversationPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "Conversation"
    objects: {
      contact: Prisma.$ContactPayload<ExtArgs>
      channel: Prisma.$ChannelPayload<ExtArgs>
      bot: Prisma.$BotPayload<ExtArgs> | null
      assigned_user: Prisma.$UserPayload<ExtArgs> | null
      company: Prisma.$CompanyPayload<ExtArgs>
      messages: Prisma.$MessagePayload<ExtArgs>[]
      tickets: Prisma.$TicketPayload<ExtArgs>[]
    }
    scalars: $Extensions.GetPayloadResult<{
      id: string
      contact_id: string
      channel_id: string
      bot_id: string | null
      status: string
      assigned_to: string | null
      last_message_at: Date
      company_id: string
      metadata: Prisma.JsonValue
      created_at: Date
      updated_at: Date
    }, ExtArgs["result"]["conversation"]>
    composites: {}
  }

  type ConversationGetPayload<S extends boolean | null | undefined | ConversationDefaultArgs> = $Result.GetResult<Prisma.$ConversationPayload, S>

  type ConversationCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = 
    Omit<ConversationFindManyArgs, 'select' | 'include' | 'distinct'> & {
      select?: ConversationCountAggregateInputType | true
    }

  export interface ConversationDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['Conversation'], meta: { name: 'Conversation' } }
    /**
     * Find zero or one Conversation that matches the filter.
     * @param {ConversationFindUniqueArgs} args - Arguments to find a Conversation
     * @example
     * // Get one Conversation
     * const conversation = await prisma.conversation.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends ConversationFindUniqueArgs>(args: SelectSubset<T, ConversationFindUniqueArgs<ExtArgs>>): Prisma__ConversationClient<$Result.GetResult<Prisma.$ConversationPayload<ExtArgs>, T, "findUnique"> | null, null, ExtArgs>

    /**
     * Find one Conversation that matches the filter or throw an error with `error.code='P2025'` 
     * if no matches were found.
     * @param {ConversationFindUniqueOrThrowArgs} args - Arguments to find a Conversation
     * @example
     * // Get one Conversation
     * const conversation = await prisma.conversation.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends ConversationFindUniqueOrThrowArgs>(args: SelectSubset<T, ConversationFindUniqueOrThrowArgs<ExtArgs>>): Prisma__ConversationClient<$Result.GetResult<Prisma.$ConversationPayload<ExtArgs>, T, "findUniqueOrThrow">, never, ExtArgs>

    /**
     * Find the first Conversation that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ConversationFindFirstArgs} args - Arguments to find a Conversation
     * @example
     * // Get one Conversation
     * const conversation = await prisma.conversation.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends ConversationFindFirstArgs>(args?: SelectSubset<T, ConversationFindFirstArgs<ExtArgs>>): Prisma__ConversationClient<$Result.GetResult<Prisma.$ConversationPayload<ExtArgs>, T, "findFirst"> | null, null, ExtArgs>

    /**
     * Find the first Conversation that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ConversationFindFirstOrThrowArgs} args - Arguments to find a Conversation
     * @example
     * // Get one Conversation
     * const conversation = await prisma.conversation.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends ConversationFindFirstOrThrowArgs>(args?: SelectSubset<T, ConversationFindFirstOrThrowArgs<ExtArgs>>): Prisma__ConversationClient<$Result.GetResult<Prisma.$ConversationPayload<ExtArgs>, T, "findFirstOrThrow">, never, ExtArgs>

    /**
     * Find zero or more Conversations that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ConversationFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all Conversations
     * const conversations = await prisma.conversation.findMany()
     * 
     * // Get first 10 Conversations
     * const conversations = await prisma.conversation.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const conversationWithIdOnly = await prisma.conversation.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends ConversationFindManyArgs>(args?: SelectSubset<T, ConversationFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$ConversationPayload<ExtArgs>, T, "findMany">>

    /**
     * Create a Conversation.
     * @param {ConversationCreateArgs} args - Arguments to create a Conversation.
     * @example
     * // Create one Conversation
     * const Conversation = await prisma.conversation.create({
     *   data: {
     *     // ... data to create a Conversation
     *   }
     * })
     * 
     */
    create<T extends ConversationCreateArgs>(args: SelectSubset<T, ConversationCreateArgs<ExtArgs>>): Prisma__ConversationClient<$Result.GetResult<Prisma.$ConversationPayload<ExtArgs>, T, "create">, never, ExtArgs>

    /**
     * Create many Conversations.
     * @param {ConversationCreateManyArgs} args - Arguments to create many Conversations.
     * @example
     * // Create many Conversations
     * const conversation = await prisma.conversation.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends ConversationCreateManyArgs>(args?: SelectSubset<T, ConversationCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many Conversations and returns the data saved in the database.
     * @param {ConversationCreateManyAndReturnArgs} args - Arguments to create many Conversations.
     * @example
     * // Create many Conversations
     * const conversation = await prisma.conversation.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many Conversations and only return the `id`
     * const conversationWithIdOnly = await prisma.conversation.createManyAndReturn({ 
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends ConversationCreateManyAndReturnArgs>(args?: SelectSubset<T, ConversationCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$ConversationPayload<ExtArgs>, T, "createManyAndReturn">>

    /**
     * Delete a Conversation.
     * @param {ConversationDeleteArgs} args - Arguments to delete one Conversation.
     * @example
     * // Delete one Conversation
     * const Conversation = await prisma.conversation.delete({
     *   where: {
     *     // ... filter to delete one Conversation
     *   }
     * })
     * 
     */
    delete<T extends ConversationDeleteArgs>(args: SelectSubset<T, ConversationDeleteArgs<ExtArgs>>): Prisma__ConversationClient<$Result.GetResult<Prisma.$ConversationPayload<ExtArgs>, T, "delete">, never, ExtArgs>

    /**
     * Update one Conversation.
     * @param {ConversationUpdateArgs} args - Arguments to update one Conversation.
     * @example
     * // Update one Conversation
     * const conversation = await prisma.conversation.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends ConversationUpdateArgs>(args: SelectSubset<T, ConversationUpdateArgs<ExtArgs>>): Prisma__ConversationClient<$Result.GetResult<Prisma.$ConversationPayload<ExtArgs>, T, "update">, never, ExtArgs>

    /**
     * Delete zero or more Conversations.
     * @param {ConversationDeleteManyArgs} args - Arguments to filter Conversations to delete.
     * @example
     * // Delete a few Conversations
     * const { count } = await prisma.conversation.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends ConversationDeleteManyArgs>(args?: SelectSubset<T, ConversationDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Conversations.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ConversationUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many Conversations
     * const conversation = await prisma.conversation.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends ConversationUpdateManyArgs>(args: SelectSubset<T, ConversationUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create or update one Conversation.
     * @param {ConversationUpsertArgs} args - Arguments to update or create a Conversation.
     * @example
     * // Update or create a Conversation
     * const conversation = await prisma.conversation.upsert({
     *   create: {
     *     // ... data to create a Conversation
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the Conversation we want to update
     *   }
     * })
     */
    upsert<T extends ConversationUpsertArgs>(args: SelectSubset<T, ConversationUpsertArgs<ExtArgs>>): Prisma__ConversationClient<$Result.GetResult<Prisma.$ConversationPayload<ExtArgs>, T, "upsert">, never, ExtArgs>


    /**
     * Count the number of Conversations.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ConversationCountArgs} args - Arguments to filter Conversations to count.
     * @example
     * // Count the number of Conversations
     * const count = await prisma.conversation.count({
     *   where: {
     *     // ... the filter for the Conversations we want to count
     *   }
     * })
    **/
    count<T extends ConversationCountArgs>(
      args?: Subset<T, ConversationCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], ConversationCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a Conversation.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ConversationAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends ConversationAggregateArgs>(args: Subset<T, ConversationAggregateArgs>): Prisma.PrismaPromise<GetConversationAggregateType<T>>

    /**
     * Group by Conversation.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ConversationGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends ConversationGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: ConversationGroupByArgs['orderBy'] }
        : { orderBy?: ConversationGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, ConversationGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetConversationGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the Conversation model
   */
  readonly fields: ConversationFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for Conversation.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__ConversationClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    contact<T extends ContactDefaultArgs<ExtArgs> = {}>(args?: Subset<T, ContactDefaultArgs<ExtArgs>>): Prisma__ContactClient<$Result.GetResult<Prisma.$ContactPayload<ExtArgs>, T, "findUniqueOrThrow"> | Null, Null, ExtArgs>
    channel<T extends ChannelDefaultArgs<ExtArgs> = {}>(args?: Subset<T, ChannelDefaultArgs<ExtArgs>>): Prisma__ChannelClient<$Result.GetResult<Prisma.$ChannelPayload<ExtArgs>, T, "findUniqueOrThrow"> | Null, Null, ExtArgs>
    bot<T extends Conversation$botArgs<ExtArgs> = {}>(args?: Subset<T, Conversation$botArgs<ExtArgs>>): Prisma__BotClient<$Result.GetResult<Prisma.$BotPayload<ExtArgs>, T, "findUniqueOrThrow"> | null, null, ExtArgs>
    assigned_user<T extends Conversation$assigned_userArgs<ExtArgs> = {}>(args?: Subset<T, Conversation$assigned_userArgs<ExtArgs>>): Prisma__UserClient<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "findUniqueOrThrow"> | null, null, ExtArgs>
    company<T extends CompanyDefaultArgs<ExtArgs> = {}>(args?: Subset<T, CompanyDefaultArgs<ExtArgs>>): Prisma__CompanyClient<$Result.GetResult<Prisma.$CompanyPayload<ExtArgs>, T, "findUniqueOrThrow"> | Null, Null, ExtArgs>
    messages<T extends Conversation$messagesArgs<ExtArgs> = {}>(args?: Subset<T, Conversation$messagesArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$MessagePayload<ExtArgs>, T, "findMany"> | Null>
    tickets<T extends Conversation$ticketsArgs<ExtArgs> = {}>(args?: Subset<T, Conversation$ticketsArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$TicketPayload<ExtArgs>, T, "findMany"> | Null>
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the Conversation model
   */ 
  interface ConversationFieldRefs {
    readonly id: FieldRef<"Conversation", 'String'>
    readonly contact_id: FieldRef<"Conversation", 'String'>
    readonly channel_id: FieldRef<"Conversation", 'String'>
    readonly bot_id: FieldRef<"Conversation", 'String'>
    readonly status: FieldRef<"Conversation", 'String'>
    readonly assigned_to: FieldRef<"Conversation", 'String'>
    readonly last_message_at: FieldRef<"Conversation", 'DateTime'>
    readonly company_id: FieldRef<"Conversation", 'String'>
    readonly metadata: FieldRef<"Conversation", 'Json'>
    readonly created_at: FieldRef<"Conversation", 'DateTime'>
    readonly updated_at: FieldRef<"Conversation", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * Conversation findUnique
   */
  export type ConversationFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Conversation
     */
    select?: ConversationSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ConversationInclude<ExtArgs> | null
    /**
     * Filter, which Conversation to fetch.
     */
    where: ConversationWhereUniqueInput
  }

  /**
   * Conversation findUniqueOrThrow
   */
  export type ConversationFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Conversation
     */
    select?: ConversationSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ConversationInclude<ExtArgs> | null
    /**
     * Filter, which Conversation to fetch.
     */
    where: ConversationWhereUniqueInput
  }

  /**
   * Conversation findFirst
   */
  export type ConversationFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Conversation
     */
    select?: ConversationSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ConversationInclude<ExtArgs> | null
    /**
     * Filter, which Conversation to fetch.
     */
    where?: ConversationWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Conversations to fetch.
     */
    orderBy?: ConversationOrderByWithRelationInput | ConversationOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Conversations.
     */
    cursor?: ConversationWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Conversations from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Conversations.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Conversations.
     */
    distinct?: ConversationScalarFieldEnum | ConversationScalarFieldEnum[]
  }

  /**
   * Conversation findFirstOrThrow
   */
  export type ConversationFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Conversation
     */
    select?: ConversationSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ConversationInclude<ExtArgs> | null
    /**
     * Filter, which Conversation to fetch.
     */
    where?: ConversationWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Conversations to fetch.
     */
    orderBy?: ConversationOrderByWithRelationInput | ConversationOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Conversations.
     */
    cursor?: ConversationWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Conversations from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Conversations.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Conversations.
     */
    distinct?: ConversationScalarFieldEnum | ConversationScalarFieldEnum[]
  }

  /**
   * Conversation findMany
   */
  export type ConversationFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Conversation
     */
    select?: ConversationSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ConversationInclude<ExtArgs> | null
    /**
     * Filter, which Conversations to fetch.
     */
    where?: ConversationWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Conversations to fetch.
     */
    orderBy?: ConversationOrderByWithRelationInput | ConversationOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing Conversations.
     */
    cursor?: ConversationWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Conversations from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Conversations.
     */
    skip?: number
    distinct?: ConversationScalarFieldEnum | ConversationScalarFieldEnum[]
  }

  /**
   * Conversation create
   */
  export type ConversationCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Conversation
     */
    select?: ConversationSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ConversationInclude<ExtArgs> | null
    /**
     * The data needed to create a Conversation.
     */
    data: XOR<ConversationCreateInput, ConversationUncheckedCreateInput>
  }

  /**
   * Conversation createMany
   */
  export type ConversationCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many Conversations.
     */
    data: ConversationCreateManyInput | ConversationCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * Conversation createManyAndReturn
   */
  export type ConversationCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Conversation
     */
    select?: ConversationSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * The data used to create many Conversations.
     */
    data: ConversationCreateManyInput | ConversationCreateManyInput[]
    skipDuplicates?: boolean
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ConversationIncludeCreateManyAndReturn<ExtArgs> | null
  }

  /**
   * Conversation update
   */
  export type ConversationUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Conversation
     */
    select?: ConversationSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ConversationInclude<ExtArgs> | null
    /**
     * The data needed to update a Conversation.
     */
    data: XOR<ConversationUpdateInput, ConversationUncheckedUpdateInput>
    /**
     * Choose, which Conversation to update.
     */
    where: ConversationWhereUniqueInput
  }

  /**
   * Conversation updateMany
   */
  export type ConversationUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update Conversations.
     */
    data: XOR<ConversationUpdateManyMutationInput, ConversationUncheckedUpdateManyInput>
    /**
     * Filter which Conversations to update
     */
    where?: ConversationWhereInput
  }

  /**
   * Conversation upsert
   */
  export type ConversationUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Conversation
     */
    select?: ConversationSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ConversationInclude<ExtArgs> | null
    /**
     * The filter to search for the Conversation to update in case it exists.
     */
    where: ConversationWhereUniqueInput
    /**
     * In case the Conversation found by the `where` argument doesn't exist, create a new Conversation with this data.
     */
    create: XOR<ConversationCreateInput, ConversationUncheckedCreateInput>
    /**
     * In case the Conversation was found with the provided `where` argument, update it with this data.
     */
    update: XOR<ConversationUpdateInput, ConversationUncheckedUpdateInput>
  }

  /**
   * Conversation delete
   */
  export type ConversationDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Conversation
     */
    select?: ConversationSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ConversationInclude<ExtArgs> | null
    /**
     * Filter which Conversation to delete.
     */
    where: ConversationWhereUniqueInput
  }

  /**
   * Conversation deleteMany
   */
  export type ConversationDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Conversations to delete
     */
    where?: ConversationWhereInput
  }

  /**
   * Conversation.bot
   */
  export type Conversation$botArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Bot
     */
    select?: BotSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: BotInclude<ExtArgs> | null
    where?: BotWhereInput
  }

  /**
   * Conversation.assigned_user
   */
  export type Conversation$assigned_userArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the User
     */
    select?: UserSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: UserInclude<ExtArgs> | null
    where?: UserWhereInput
  }

  /**
   * Conversation.messages
   */
  export type Conversation$messagesArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Message
     */
    select?: MessageSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: MessageInclude<ExtArgs> | null
    where?: MessageWhereInput
    orderBy?: MessageOrderByWithRelationInput | MessageOrderByWithRelationInput[]
    cursor?: MessageWhereUniqueInput
    take?: number
    skip?: number
    distinct?: MessageScalarFieldEnum | MessageScalarFieldEnum[]
  }

  /**
   * Conversation.tickets
   */
  export type Conversation$ticketsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Ticket
     */
    select?: TicketSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TicketInclude<ExtArgs> | null
    where?: TicketWhereInput
    orderBy?: TicketOrderByWithRelationInput | TicketOrderByWithRelationInput[]
    cursor?: TicketWhereUniqueInput
    take?: number
    skip?: number
    distinct?: TicketScalarFieldEnum | TicketScalarFieldEnum[]
  }

  /**
   * Conversation without action
   */
  export type ConversationDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Conversation
     */
    select?: ConversationSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ConversationInclude<ExtArgs> | null
  }


  /**
   * Model Message
   */

  export type AggregateMessage = {
    _count: MessageCountAggregateOutputType | null
    _min: MessageMinAggregateOutputType | null
    _max: MessageMaxAggregateOutputType | null
  }

  export type MessageMinAggregateOutputType = {
    id: string | null
    conversation_id: string | null
    content: string | null
    message_type: string | null
    sender_type: string | null
    sender_id: string | null
    external_id: string | null
    created_at: Date | null
  }

  export type MessageMaxAggregateOutputType = {
    id: string | null
    conversation_id: string | null
    content: string | null
    message_type: string | null
    sender_type: string | null
    sender_id: string | null
    external_id: string | null
    created_at: Date | null
  }

  export type MessageCountAggregateOutputType = {
    id: number
    conversation_id: number
    content: number
    message_type: number
    sender_type: number
    sender_id: number
    external_id: number
    metadata: number
    created_at: number
    _all: number
  }


  export type MessageMinAggregateInputType = {
    id?: true
    conversation_id?: true
    content?: true
    message_type?: true
    sender_type?: true
    sender_id?: true
    external_id?: true
    created_at?: true
  }

  export type MessageMaxAggregateInputType = {
    id?: true
    conversation_id?: true
    content?: true
    message_type?: true
    sender_type?: true
    sender_id?: true
    external_id?: true
    created_at?: true
  }

  export type MessageCountAggregateInputType = {
    id?: true
    conversation_id?: true
    content?: true
    message_type?: true
    sender_type?: true
    sender_id?: true
    external_id?: true
    metadata?: true
    created_at?: true
    _all?: true
  }

  export type MessageAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Message to aggregate.
     */
    where?: MessageWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Messages to fetch.
     */
    orderBy?: MessageOrderByWithRelationInput | MessageOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: MessageWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Messages from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Messages.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned Messages
    **/
    _count?: true | MessageCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: MessageMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: MessageMaxAggregateInputType
  }

  export type GetMessageAggregateType<T extends MessageAggregateArgs> = {
        [P in keyof T & keyof AggregateMessage]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateMessage[P]>
      : GetScalarType<T[P], AggregateMessage[P]>
  }




  export type MessageGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: MessageWhereInput
    orderBy?: MessageOrderByWithAggregationInput | MessageOrderByWithAggregationInput[]
    by: MessageScalarFieldEnum[] | MessageScalarFieldEnum
    having?: MessageScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: MessageCountAggregateInputType | true
    _min?: MessageMinAggregateInputType
    _max?: MessageMaxAggregateInputType
  }

  export type MessageGroupByOutputType = {
    id: string
    conversation_id: string
    content: string
    message_type: string
    sender_type: string
    sender_id: string | null
    external_id: string | null
    metadata: JsonValue
    created_at: Date
    _count: MessageCountAggregateOutputType | null
    _min: MessageMinAggregateOutputType | null
    _max: MessageMaxAggregateOutputType | null
  }

  type GetMessageGroupByPayload<T extends MessageGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<MessageGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof MessageGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], MessageGroupByOutputType[P]>
            : GetScalarType<T[P], MessageGroupByOutputType[P]>
        }
      >
    >


  export type MessageSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    conversation_id?: boolean
    content?: boolean
    message_type?: boolean
    sender_type?: boolean
    sender_id?: boolean
    external_id?: boolean
    metadata?: boolean
    created_at?: boolean
    conversation?: boolean | ConversationDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["message"]>

  export type MessageSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    conversation_id?: boolean
    content?: boolean
    message_type?: boolean
    sender_type?: boolean
    sender_id?: boolean
    external_id?: boolean
    metadata?: boolean
    created_at?: boolean
    conversation?: boolean | ConversationDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["message"]>

  export type MessageSelectScalar = {
    id?: boolean
    conversation_id?: boolean
    content?: boolean
    message_type?: boolean
    sender_type?: boolean
    sender_id?: boolean
    external_id?: boolean
    metadata?: boolean
    created_at?: boolean
  }

  export type MessageInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    conversation?: boolean | ConversationDefaultArgs<ExtArgs>
  }
  export type MessageIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    conversation?: boolean | ConversationDefaultArgs<ExtArgs>
  }

  export type $MessagePayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "Message"
    objects: {
      conversation: Prisma.$ConversationPayload<ExtArgs>
    }
    scalars: $Extensions.GetPayloadResult<{
      id: string
      conversation_id: string
      content: string
      message_type: string
      sender_type: string
      sender_id: string | null
      external_id: string | null
      metadata: Prisma.JsonValue
      created_at: Date
    }, ExtArgs["result"]["message"]>
    composites: {}
  }

  type MessageGetPayload<S extends boolean | null | undefined | MessageDefaultArgs> = $Result.GetResult<Prisma.$MessagePayload, S>

  type MessageCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = 
    Omit<MessageFindManyArgs, 'select' | 'include' | 'distinct'> & {
      select?: MessageCountAggregateInputType | true
    }

  export interface MessageDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['Message'], meta: { name: 'Message' } }
    /**
     * Find zero or one Message that matches the filter.
     * @param {MessageFindUniqueArgs} args - Arguments to find a Message
     * @example
     * // Get one Message
     * const message = await prisma.message.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends MessageFindUniqueArgs>(args: SelectSubset<T, MessageFindUniqueArgs<ExtArgs>>): Prisma__MessageClient<$Result.GetResult<Prisma.$MessagePayload<ExtArgs>, T, "findUnique"> | null, null, ExtArgs>

    /**
     * Find one Message that matches the filter or throw an error with `error.code='P2025'` 
     * if no matches were found.
     * @param {MessageFindUniqueOrThrowArgs} args - Arguments to find a Message
     * @example
     * // Get one Message
     * const message = await prisma.message.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends MessageFindUniqueOrThrowArgs>(args: SelectSubset<T, MessageFindUniqueOrThrowArgs<ExtArgs>>): Prisma__MessageClient<$Result.GetResult<Prisma.$MessagePayload<ExtArgs>, T, "findUniqueOrThrow">, never, ExtArgs>

    /**
     * Find the first Message that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {MessageFindFirstArgs} args - Arguments to find a Message
     * @example
     * // Get one Message
     * const message = await prisma.message.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends MessageFindFirstArgs>(args?: SelectSubset<T, MessageFindFirstArgs<ExtArgs>>): Prisma__MessageClient<$Result.GetResult<Prisma.$MessagePayload<ExtArgs>, T, "findFirst"> | null, null, ExtArgs>

    /**
     * Find the first Message that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {MessageFindFirstOrThrowArgs} args - Arguments to find a Message
     * @example
     * // Get one Message
     * const message = await prisma.message.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends MessageFindFirstOrThrowArgs>(args?: SelectSubset<T, MessageFindFirstOrThrowArgs<ExtArgs>>): Prisma__MessageClient<$Result.GetResult<Prisma.$MessagePayload<ExtArgs>, T, "findFirstOrThrow">, never, ExtArgs>

    /**
     * Find zero or more Messages that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {MessageFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all Messages
     * const messages = await prisma.message.findMany()
     * 
     * // Get first 10 Messages
     * const messages = await prisma.message.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const messageWithIdOnly = await prisma.message.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends MessageFindManyArgs>(args?: SelectSubset<T, MessageFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$MessagePayload<ExtArgs>, T, "findMany">>

    /**
     * Create a Message.
     * @param {MessageCreateArgs} args - Arguments to create a Message.
     * @example
     * // Create one Message
     * const Message = await prisma.message.create({
     *   data: {
     *     // ... data to create a Message
     *   }
     * })
     * 
     */
    create<T extends MessageCreateArgs>(args: SelectSubset<T, MessageCreateArgs<ExtArgs>>): Prisma__MessageClient<$Result.GetResult<Prisma.$MessagePayload<ExtArgs>, T, "create">, never, ExtArgs>

    /**
     * Create many Messages.
     * @param {MessageCreateManyArgs} args - Arguments to create many Messages.
     * @example
     * // Create many Messages
     * const message = await prisma.message.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends MessageCreateManyArgs>(args?: SelectSubset<T, MessageCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many Messages and returns the data saved in the database.
     * @param {MessageCreateManyAndReturnArgs} args - Arguments to create many Messages.
     * @example
     * // Create many Messages
     * const message = await prisma.message.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many Messages and only return the `id`
     * const messageWithIdOnly = await prisma.message.createManyAndReturn({ 
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends MessageCreateManyAndReturnArgs>(args?: SelectSubset<T, MessageCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$MessagePayload<ExtArgs>, T, "createManyAndReturn">>

    /**
     * Delete a Message.
     * @param {MessageDeleteArgs} args - Arguments to delete one Message.
     * @example
     * // Delete one Message
     * const Message = await prisma.message.delete({
     *   where: {
     *     // ... filter to delete one Message
     *   }
     * })
     * 
     */
    delete<T extends MessageDeleteArgs>(args: SelectSubset<T, MessageDeleteArgs<ExtArgs>>): Prisma__MessageClient<$Result.GetResult<Prisma.$MessagePayload<ExtArgs>, T, "delete">, never, ExtArgs>

    /**
     * Update one Message.
     * @param {MessageUpdateArgs} args - Arguments to update one Message.
     * @example
     * // Update one Message
     * const message = await prisma.message.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends MessageUpdateArgs>(args: SelectSubset<T, MessageUpdateArgs<ExtArgs>>): Prisma__MessageClient<$Result.GetResult<Prisma.$MessagePayload<ExtArgs>, T, "update">, never, ExtArgs>

    /**
     * Delete zero or more Messages.
     * @param {MessageDeleteManyArgs} args - Arguments to filter Messages to delete.
     * @example
     * // Delete a few Messages
     * const { count } = await prisma.message.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends MessageDeleteManyArgs>(args?: SelectSubset<T, MessageDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Messages.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {MessageUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many Messages
     * const message = await prisma.message.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends MessageUpdateManyArgs>(args: SelectSubset<T, MessageUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create or update one Message.
     * @param {MessageUpsertArgs} args - Arguments to update or create a Message.
     * @example
     * // Update or create a Message
     * const message = await prisma.message.upsert({
     *   create: {
     *     // ... data to create a Message
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the Message we want to update
     *   }
     * })
     */
    upsert<T extends MessageUpsertArgs>(args: SelectSubset<T, MessageUpsertArgs<ExtArgs>>): Prisma__MessageClient<$Result.GetResult<Prisma.$MessagePayload<ExtArgs>, T, "upsert">, never, ExtArgs>


    /**
     * Count the number of Messages.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {MessageCountArgs} args - Arguments to filter Messages to count.
     * @example
     * // Count the number of Messages
     * const count = await prisma.message.count({
     *   where: {
     *     // ... the filter for the Messages we want to count
     *   }
     * })
    **/
    count<T extends MessageCountArgs>(
      args?: Subset<T, MessageCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], MessageCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a Message.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {MessageAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends MessageAggregateArgs>(args: Subset<T, MessageAggregateArgs>): Prisma.PrismaPromise<GetMessageAggregateType<T>>

    /**
     * Group by Message.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {MessageGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends MessageGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: MessageGroupByArgs['orderBy'] }
        : { orderBy?: MessageGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, MessageGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetMessageGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the Message model
   */
  readonly fields: MessageFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for Message.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__MessageClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    conversation<T extends ConversationDefaultArgs<ExtArgs> = {}>(args?: Subset<T, ConversationDefaultArgs<ExtArgs>>): Prisma__ConversationClient<$Result.GetResult<Prisma.$ConversationPayload<ExtArgs>, T, "findUniqueOrThrow"> | Null, Null, ExtArgs>
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the Message model
   */ 
  interface MessageFieldRefs {
    readonly id: FieldRef<"Message", 'String'>
    readonly conversation_id: FieldRef<"Message", 'String'>
    readonly content: FieldRef<"Message", 'String'>
    readonly message_type: FieldRef<"Message", 'String'>
    readonly sender_type: FieldRef<"Message", 'String'>
    readonly sender_id: FieldRef<"Message", 'String'>
    readonly external_id: FieldRef<"Message", 'String'>
    readonly metadata: FieldRef<"Message", 'Json'>
    readonly created_at: FieldRef<"Message", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * Message findUnique
   */
  export type MessageFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Message
     */
    select?: MessageSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: MessageInclude<ExtArgs> | null
    /**
     * Filter, which Message to fetch.
     */
    where: MessageWhereUniqueInput
  }

  /**
   * Message findUniqueOrThrow
   */
  export type MessageFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Message
     */
    select?: MessageSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: MessageInclude<ExtArgs> | null
    /**
     * Filter, which Message to fetch.
     */
    where: MessageWhereUniqueInput
  }

  /**
   * Message findFirst
   */
  export type MessageFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Message
     */
    select?: MessageSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: MessageInclude<ExtArgs> | null
    /**
     * Filter, which Message to fetch.
     */
    where?: MessageWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Messages to fetch.
     */
    orderBy?: MessageOrderByWithRelationInput | MessageOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Messages.
     */
    cursor?: MessageWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Messages from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Messages.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Messages.
     */
    distinct?: MessageScalarFieldEnum | MessageScalarFieldEnum[]
  }

  /**
   * Message findFirstOrThrow
   */
  export type MessageFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Message
     */
    select?: MessageSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: MessageInclude<ExtArgs> | null
    /**
     * Filter, which Message to fetch.
     */
    where?: MessageWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Messages to fetch.
     */
    orderBy?: MessageOrderByWithRelationInput | MessageOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Messages.
     */
    cursor?: MessageWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Messages from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Messages.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Messages.
     */
    distinct?: MessageScalarFieldEnum | MessageScalarFieldEnum[]
  }

  /**
   * Message findMany
   */
  export type MessageFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Message
     */
    select?: MessageSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: MessageInclude<ExtArgs> | null
    /**
     * Filter, which Messages to fetch.
     */
    where?: MessageWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Messages to fetch.
     */
    orderBy?: MessageOrderByWithRelationInput | MessageOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing Messages.
     */
    cursor?: MessageWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Messages from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Messages.
     */
    skip?: number
    distinct?: MessageScalarFieldEnum | MessageScalarFieldEnum[]
  }

  /**
   * Message create
   */
  export type MessageCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Message
     */
    select?: MessageSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: MessageInclude<ExtArgs> | null
    /**
     * The data needed to create a Message.
     */
    data: XOR<MessageCreateInput, MessageUncheckedCreateInput>
  }

  /**
   * Message createMany
   */
  export type MessageCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many Messages.
     */
    data: MessageCreateManyInput | MessageCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * Message createManyAndReturn
   */
  export type MessageCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Message
     */
    select?: MessageSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * The data used to create many Messages.
     */
    data: MessageCreateManyInput | MessageCreateManyInput[]
    skipDuplicates?: boolean
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: MessageIncludeCreateManyAndReturn<ExtArgs> | null
  }

  /**
   * Message update
   */
  export type MessageUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Message
     */
    select?: MessageSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: MessageInclude<ExtArgs> | null
    /**
     * The data needed to update a Message.
     */
    data: XOR<MessageUpdateInput, MessageUncheckedUpdateInput>
    /**
     * Choose, which Message to update.
     */
    where: MessageWhereUniqueInput
  }

  /**
   * Message updateMany
   */
  export type MessageUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update Messages.
     */
    data: XOR<MessageUpdateManyMutationInput, MessageUncheckedUpdateManyInput>
    /**
     * Filter which Messages to update
     */
    where?: MessageWhereInput
  }

  /**
   * Message upsert
   */
  export type MessageUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Message
     */
    select?: MessageSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: MessageInclude<ExtArgs> | null
    /**
     * The filter to search for the Message to update in case it exists.
     */
    where: MessageWhereUniqueInput
    /**
     * In case the Message found by the `where` argument doesn't exist, create a new Message with this data.
     */
    create: XOR<MessageCreateInput, MessageUncheckedCreateInput>
    /**
     * In case the Message was found with the provided `where` argument, update it with this data.
     */
    update: XOR<MessageUpdateInput, MessageUncheckedUpdateInput>
  }

  /**
   * Message delete
   */
  export type MessageDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Message
     */
    select?: MessageSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: MessageInclude<ExtArgs> | null
    /**
     * Filter which Message to delete.
     */
    where: MessageWhereUniqueInput
  }

  /**
   * Message deleteMany
   */
  export type MessageDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Messages to delete
     */
    where?: MessageWhereInput
  }

  /**
   * Message without action
   */
  export type MessageDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Message
     */
    select?: MessageSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: MessageInclude<ExtArgs> | null
  }


  /**
   * Model Ticket
   */

  export type AggregateTicket = {
    _count: TicketCountAggregateOutputType | null
    _min: TicketMinAggregateOutputType | null
    _max: TicketMaxAggregateOutputType | null
  }

  export type TicketMinAggregateOutputType = {
    id: string | null
    ticket_number: string | null
    conversation_id: string | null
    title: string | null
    description: string | null
    status: string | null
    priority: string | null
    assigned_to: string | null
    company_id: string | null
    created_at: Date | null
    updated_at: Date | null
  }

  export type TicketMaxAggregateOutputType = {
    id: string | null
    ticket_number: string | null
    conversation_id: string | null
    title: string | null
    description: string | null
    status: string | null
    priority: string | null
    assigned_to: string | null
    company_id: string | null
    created_at: Date | null
    updated_at: Date | null
  }

  export type TicketCountAggregateOutputType = {
    id: number
    ticket_number: number
    conversation_id: number
    title: number
    description: number
    status: number
    priority: number
    assigned_to: number
    form_data: number
    company_id: number
    created_at: number
    updated_at: number
    _all: number
  }


  export type TicketMinAggregateInputType = {
    id?: true
    ticket_number?: true
    conversation_id?: true
    title?: true
    description?: true
    status?: true
    priority?: true
    assigned_to?: true
    company_id?: true
    created_at?: true
    updated_at?: true
  }

  export type TicketMaxAggregateInputType = {
    id?: true
    ticket_number?: true
    conversation_id?: true
    title?: true
    description?: true
    status?: true
    priority?: true
    assigned_to?: true
    company_id?: true
    created_at?: true
    updated_at?: true
  }

  export type TicketCountAggregateInputType = {
    id?: true
    ticket_number?: true
    conversation_id?: true
    title?: true
    description?: true
    status?: true
    priority?: true
    assigned_to?: true
    form_data?: true
    company_id?: true
    created_at?: true
    updated_at?: true
    _all?: true
  }

  export type TicketAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Ticket to aggregate.
     */
    where?: TicketWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Tickets to fetch.
     */
    orderBy?: TicketOrderByWithRelationInput | TicketOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: TicketWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Tickets from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Tickets.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned Tickets
    **/
    _count?: true | TicketCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: TicketMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: TicketMaxAggregateInputType
  }

  export type GetTicketAggregateType<T extends TicketAggregateArgs> = {
        [P in keyof T & keyof AggregateTicket]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateTicket[P]>
      : GetScalarType<T[P], AggregateTicket[P]>
  }




  export type TicketGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: TicketWhereInput
    orderBy?: TicketOrderByWithAggregationInput | TicketOrderByWithAggregationInput[]
    by: TicketScalarFieldEnum[] | TicketScalarFieldEnum
    having?: TicketScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: TicketCountAggregateInputType | true
    _min?: TicketMinAggregateInputType
    _max?: TicketMaxAggregateInputType
  }

  export type TicketGroupByOutputType = {
    id: string
    ticket_number: string
    conversation_id: string
    title: string
    description: string | null
    status: string
    priority: string
    assigned_to: string | null
    form_data: JsonValue
    company_id: string
    created_at: Date
    updated_at: Date
    _count: TicketCountAggregateOutputType | null
    _min: TicketMinAggregateOutputType | null
    _max: TicketMaxAggregateOutputType | null
  }

  type GetTicketGroupByPayload<T extends TicketGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<TicketGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof TicketGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], TicketGroupByOutputType[P]>
            : GetScalarType<T[P], TicketGroupByOutputType[P]>
        }
      >
    >


  export type TicketSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    ticket_number?: boolean
    conversation_id?: boolean
    title?: boolean
    description?: boolean
    status?: boolean
    priority?: boolean
    assigned_to?: boolean
    form_data?: boolean
    company_id?: boolean
    created_at?: boolean
    updated_at?: boolean
    conversation?: boolean | ConversationDefaultArgs<ExtArgs>
    assigned_user?: boolean | Ticket$assigned_userArgs<ExtArgs>
    company?: boolean | CompanyDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["ticket"]>

  export type TicketSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    ticket_number?: boolean
    conversation_id?: boolean
    title?: boolean
    description?: boolean
    status?: boolean
    priority?: boolean
    assigned_to?: boolean
    form_data?: boolean
    company_id?: boolean
    created_at?: boolean
    updated_at?: boolean
    conversation?: boolean | ConversationDefaultArgs<ExtArgs>
    assigned_user?: boolean | Ticket$assigned_userArgs<ExtArgs>
    company?: boolean | CompanyDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["ticket"]>

  export type TicketSelectScalar = {
    id?: boolean
    ticket_number?: boolean
    conversation_id?: boolean
    title?: boolean
    description?: boolean
    status?: boolean
    priority?: boolean
    assigned_to?: boolean
    form_data?: boolean
    company_id?: boolean
    created_at?: boolean
    updated_at?: boolean
  }

  export type TicketInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    conversation?: boolean | ConversationDefaultArgs<ExtArgs>
    assigned_user?: boolean | Ticket$assigned_userArgs<ExtArgs>
    company?: boolean | CompanyDefaultArgs<ExtArgs>
  }
  export type TicketIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    conversation?: boolean | ConversationDefaultArgs<ExtArgs>
    assigned_user?: boolean | Ticket$assigned_userArgs<ExtArgs>
    company?: boolean | CompanyDefaultArgs<ExtArgs>
  }

  export type $TicketPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "Ticket"
    objects: {
      conversation: Prisma.$ConversationPayload<ExtArgs>
      assigned_user: Prisma.$UserPayload<ExtArgs> | null
      company: Prisma.$CompanyPayload<ExtArgs>
    }
    scalars: $Extensions.GetPayloadResult<{
      id: string
      ticket_number: string
      conversation_id: string
      title: string
      description: string | null
      status: string
      priority: string
      assigned_to: string | null
      form_data: Prisma.JsonValue
      company_id: string
      created_at: Date
      updated_at: Date
    }, ExtArgs["result"]["ticket"]>
    composites: {}
  }

  type TicketGetPayload<S extends boolean | null | undefined | TicketDefaultArgs> = $Result.GetResult<Prisma.$TicketPayload, S>

  type TicketCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = 
    Omit<TicketFindManyArgs, 'select' | 'include' | 'distinct'> & {
      select?: TicketCountAggregateInputType | true
    }

  export interface TicketDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['Ticket'], meta: { name: 'Ticket' } }
    /**
     * Find zero or one Ticket that matches the filter.
     * @param {TicketFindUniqueArgs} args - Arguments to find a Ticket
     * @example
     * // Get one Ticket
     * const ticket = await prisma.ticket.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends TicketFindUniqueArgs>(args: SelectSubset<T, TicketFindUniqueArgs<ExtArgs>>): Prisma__TicketClient<$Result.GetResult<Prisma.$TicketPayload<ExtArgs>, T, "findUnique"> | null, null, ExtArgs>

    /**
     * Find one Ticket that matches the filter or throw an error with `error.code='P2025'` 
     * if no matches were found.
     * @param {TicketFindUniqueOrThrowArgs} args - Arguments to find a Ticket
     * @example
     * // Get one Ticket
     * const ticket = await prisma.ticket.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends TicketFindUniqueOrThrowArgs>(args: SelectSubset<T, TicketFindUniqueOrThrowArgs<ExtArgs>>): Prisma__TicketClient<$Result.GetResult<Prisma.$TicketPayload<ExtArgs>, T, "findUniqueOrThrow">, never, ExtArgs>

    /**
     * Find the first Ticket that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {TicketFindFirstArgs} args - Arguments to find a Ticket
     * @example
     * // Get one Ticket
     * const ticket = await prisma.ticket.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends TicketFindFirstArgs>(args?: SelectSubset<T, TicketFindFirstArgs<ExtArgs>>): Prisma__TicketClient<$Result.GetResult<Prisma.$TicketPayload<ExtArgs>, T, "findFirst"> | null, null, ExtArgs>

    /**
     * Find the first Ticket that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {TicketFindFirstOrThrowArgs} args - Arguments to find a Ticket
     * @example
     * // Get one Ticket
     * const ticket = await prisma.ticket.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends TicketFindFirstOrThrowArgs>(args?: SelectSubset<T, TicketFindFirstOrThrowArgs<ExtArgs>>): Prisma__TicketClient<$Result.GetResult<Prisma.$TicketPayload<ExtArgs>, T, "findFirstOrThrow">, never, ExtArgs>

    /**
     * Find zero or more Tickets that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {TicketFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all Tickets
     * const tickets = await prisma.ticket.findMany()
     * 
     * // Get first 10 Tickets
     * const tickets = await prisma.ticket.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const ticketWithIdOnly = await prisma.ticket.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends TicketFindManyArgs>(args?: SelectSubset<T, TicketFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$TicketPayload<ExtArgs>, T, "findMany">>

    /**
     * Create a Ticket.
     * @param {TicketCreateArgs} args - Arguments to create a Ticket.
     * @example
     * // Create one Ticket
     * const Ticket = await prisma.ticket.create({
     *   data: {
     *     // ... data to create a Ticket
     *   }
     * })
     * 
     */
    create<T extends TicketCreateArgs>(args: SelectSubset<T, TicketCreateArgs<ExtArgs>>): Prisma__TicketClient<$Result.GetResult<Prisma.$TicketPayload<ExtArgs>, T, "create">, never, ExtArgs>

    /**
     * Create many Tickets.
     * @param {TicketCreateManyArgs} args - Arguments to create many Tickets.
     * @example
     * // Create many Tickets
     * const ticket = await prisma.ticket.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends TicketCreateManyArgs>(args?: SelectSubset<T, TicketCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many Tickets and returns the data saved in the database.
     * @param {TicketCreateManyAndReturnArgs} args - Arguments to create many Tickets.
     * @example
     * // Create many Tickets
     * const ticket = await prisma.ticket.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many Tickets and only return the `id`
     * const ticketWithIdOnly = await prisma.ticket.createManyAndReturn({ 
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends TicketCreateManyAndReturnArgs>(args?: SelectSubset<T, TicketCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$TicketPayload<ExtArgs>, T, "createManyAndReturn">>

    /**
     * Delete a Ticket.
     * @param {TicketDeleteArgs} args - Arguments to delete one Ticket.
     * @example
     * // Delete one Ticket
     * const Ticket = await prisma.ticket.delete({
     *   where: {
     *     // ... filter to delete one Ticket
     *   }
     * })
     * 
     */
    delete<T extends TicketDeleteArgs>(args: SelectSubset<T, TicketDeleteArgs<ExtArgs>>): Prisma__TicketClient<$Result.GetResult<Prisma.$TicketPayload<ExtArgs>, T, "delete">, never, ExtArgs>

    /**
     * Update one Ticket.
     * @param {TicketUpdateArgs} args - Arguments to update one Ticket.
     * @example
     * // Update one Ticket
     * const ticket = await prisma.ticket.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends TicketUpdateArgs>(args: SelectSubset<T, TicketUpdateArgs<ExtArgs>>): Prisma__TicketClient<$Result.GetResult<Prisma.$TicketPayload<ExtArgs>, T, "update">, never, ExtArgs>

    /**
     * Delete zero or more Tickets.
     * @param {TicketDeleteManyArgs} args - Arguments to filter Tickets to delete.
     * @example
     * // Delete a few Tickets
     * const { count } = await prisma.ticket.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends TicketDeleteManyArgs>(args?: SelectSubset<T, TicketDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Tickets.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {TicketUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many Tickets
     * const ticket = await prisma.ticket.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends TicketUpdateManyArgs>(args: SelectSubset<T, TicketUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create or update one Ticket.
     * @param {TicketUpsertArgs} args - Arguments to update or create a Ticket.
     * @example
     * // Update or create a Ticket
     * const ticket = await prisma.ticket.upsert({
     *   create: {
     *     // ... data to create a Ticket
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the Ticket we want to update
     *   }
     * })
     */
    upsert<T extends TicketUpsertArgs>(args: SelectSubset<T, TicketUpsertArgs<ExtArgs>>): Prisma__TicketClient<$Result.GetResult<Prisma.$TicketPayload<ExtArgs>, T, "upsert">, never, ExtArgs>


    /**
     * Count the number of Tickets.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {TicketCountArgs} args - Arguments to filter Tickets to count.
     * @example
     * // Count the number of Tickets
     * const count = await prisma.ticket.count({
     *   where: {
     *     // ... the filter for the Tickets we want to count
     *   }
     * })
    **/
    count<T extends TicketCountArgs>(
      args?: Subset<T, TicketCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], TicketCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a Ticket.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {TicketAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends TicketAggregateArgs>(args: Subset<T, TicketAggregateArgs>): Prisma.PrismaPromise<GetTicketAggregateType<T>>

    /**
     * Group by Ticket.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {TicketGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends TicketGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: TicketGroupByArgs['orderBy'] }
        : { orderBy?: TicketGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, TicketGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetTicketGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the Ticket model
   */
  readonly fields: TicketFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for Ticket.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__TicketClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    conversation<T extends ConversationDefaultArgs<ExtArgs> = {}>(args?: Subset<T, ConversationDefaultArgs<ExtArgs>>): Prisma__ConversationClient<$Result.GetResult<Prisma.$ConversationPayload<ExtArgs>, T, "findUniqueOrThrow"> | Null, Null, ExtArgs>
    assigned_user<T extends Ticket$assigned_userArgs<ExtArgs> = {}>(args?: Subset<T, Ticket$assigned_userArgs<ExtArgs>>): Prisma__UserClient<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "findUniqueOrThrow"> | null, null, ExtArgs>
    company<T extends CompanyDefaultArgs<ExtArgs> = {}>(args?: Subset<T, CompanyDefaultArgs<ExtArgs>>): Prisma__CompanyClient<$Result.GetResult<Prisma.$CompanyPayload<ExtArgs>, T, "findUniqueOrThrow"> | Null, Null, ExtArgs>
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the Ticket model
   */ 
  interface TicketFieldRefs {
    readonly id: FieldRef<"Ticket", 'String'>
    readonly ticket_number: FieldRef<"Ticket", 'String'>
    readonly conversation_id: FieldRef<"Ticket", 'String'>
    readonly title: FieldRef<"Ticket", 'String'>
    readonly description: FieldRef<"Ticket", 'String'>
    readonly status: FieldRef<"Ticket", 'String'>
    readonly priority: FieldRef<"Ticket", 'String'>
    readonly assigned_to: FieldRef<"Ticket", 'String'>
    readonly form_data: FieldRef<"Ticket", 'Json'>
    readonly company_id: FieldRef<"Ticket", 'String'>
    readonly created_at: FieldRef<"Ticket", 'DateTime'>
    readonly updated_at: FieldRef<"Ticket", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * Ticket findUnique
   */
  export type TicketFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Ticket
     */
    select?: TicketSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TicketInclude<ExtArgs> | null
    /**
     * Filter, which Ticket to fetch.
     */
    where: TicketWhereUniqueInput
  }

  /**
   * Ticket findUniqueOrThrow
   */
  export type TicketFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Ticket
     */
    select?: TicketSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TicketInclude<ExtArgs> | null
    /**
     * Filter, which Ticket to fetch.
     */
    where: TicketWhereUniqueInput
  }

  /**
   * Ticket findFirst
   */
  export type TicketFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Ticket
     */
    select?: TicketSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TicketInclude<ExtArgs> | null
    /**
     * Filter, which Ticket to fetch.
     */
    where?: TicketWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Tickets to fetch.
     */
    orderBy?: TicketOrderByWithRelationInput | TicketOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Tickets.
     */
    cursor?: TicketWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Tickets from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Tickets.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Tickets.
     */
    distinct?: TicketScalarFieldEnum | TicketScalarFieldEnum[]
  }

  /**
   * Ticket findFirstOrThrow
   */
  export type TicketFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Ticket
     */
    select?: TicketSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TicketInclude<ExtArgs> | null
    /**
     * Filter, which Ticket to fetch.
     */
    where?: TicketWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Tickets to fetch.
     */
    orderBy?: TicketOrderByWithRelationInput | TicketOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Tickets.
     */
    cursor?: TicketWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Tickets from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Tickets.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Tickets.
     */
    distinct?: TicketScalarFieldEnum | TicketScalarFieldEnum[]
  }

  /**
   * Ticket findMany
   */
  export type TicketFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Ticket
     */
    select?: TicketSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TicketInclude<ExtArgs> | null
    /**
     * Filter, which Tickets to fetch.
     */
    where?: TicketWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Tickets to fetch.
     */
    orderBy?: TicketOrderByWithRelationInput | TicketOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing Tickets.
     */
    cursor?: TicketWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Tickets from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Tickets.
     */
    skip?: number
    distinct?: TicketScalarFieldEnum | TicketScalarFieldEnum[]
  }

  /**
   * Ticket create
   */
  export type TicketCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Ticket
     */
    select?: TicketSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TicketInclude<ExtArgs> | null
    /**
     * The data needed to create a Ticket.
     */
    data: XOR<TicketCreateInput, TicketUncheckedCreateInput>
  }

  /**
   * Ticket createMany
   */
  export type TicketCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many Tickets.
     */
    data: TicketCreateManyInput | TicketCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * Ticket createManyAndReturn
   */
  export type TicketCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Ticket
     */
    select?: TicketSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * The data used to create many Tickets.
     */
    data: TicketCreateManyInput | TicketCreateManyInput[]
    skipDuplicates?: boolean
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TicketIncludeCreateManyAndReturn<ExtArgs> | null
  }

  /**
   * Ticket update
   */
  export type TicketUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Ticket
     */
    select?: TicketSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TicketInclude<ExtArgs> | null
    /**
     * The data needed to update a Ticket.
     */
    data: XOR<TicketUpdateInput, TicketUncheckedUpdateInput>
    /**
     * Choose, which Ticket to update.
     */
    where: TicketWhereUniqueInput
  }

  /**
   * Ticket updateMany
   */
  export type TicketUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update Tickets.
     */
    data: XOR<TicketUpdateManyMutationInput, TicketUncheckedUpdateManyInput>
    /**
     * Filter which Tickets to update
     */
    where?: TicketWhereInput
  }

  /**
   * Ticket upsert
   */
  export type TicketUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Ticket
     */
    select?: TicketSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TicketInclude<ExtArgs> | null
    /**
     * The filter to search for the Ticket to update in case it exists.
     */
    where: TicketWhereUniqueInput
    /**
     * In case the Ticket found by the `where` argument doesn't exist, create a new Ticket with this data.
     */
    create: XOR<TicketCreateInput, TicketUncheckedCreateInput>
    /**
     * In case the Ticket was found with the provided `where` argument, update it with this data.
     */
    update: XOR<TicketUpdateInput, TicketUncheckedUpdateInput>
  }

  /**
   * Ticket delete
   */
  export type TicketDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Ticket
     */
    select?: TicketSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TicketInclude<ExtArgs> | null
    /**
     * Filter which Ticket to delete.
     */
    where: TicketWhereUniqueInput
  }

  /**
   * Ticket deleteMany
   */
  export type TicketDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Tickets to delete
     */
    where?: TicketWhereInput
  }

  /**
   * Ticket.assigned_user
   */
  export type Ticket$assigned_userArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the User
     */
    select?: UserSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: UserInclude<ExtArgs> | null
    where?: UserWhereInput
  }

  /**
   * Ticket without action
   */
  export type TicketDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Ticket
     */
    select?: TicketSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TicketInclude<ExtArgs> | null
  }


  /**
   * Model WebhookEvent
   */

  export type AggregateWebhookEvent = {
    _count: WebhookEventCountAggregateOutputType | null
    _min: WebhookEventMinAggregateOutputType | null
    _max: WebhookEventMaxAggregateOutputType | null
  }

  export type WebhookEventMinAggregateOutputType = {
    id: string | null
    channel_id: string | null
    event_type: string | null
    processed: boolean | null
    processing_error: string | null
    created_at: Date | null
  }

  export type WebhookEventMaxAggregateOutputType = {
    id: string | null
    channel_id: string | null
    event_type: string | null
    processed: boolean | null
    processing_error: string | null
    created_at: Date | null
  }

  export type WebhookEventCountAggregateOutputType = {
    id: number
    channel_id: number
    event_type: number
    payload: number
    processed: number
    processing_error: number
    created_at: number
    _all: number
  }


  export type WebhookEventMinAggregateInputType = {
    id?: true
    channel_id?: true
    event_type?: true
    processed?: true
    processing_error?: true
    created_at?: true
  }

  export type WebhookEventMaxAggregateInputType = {
    id?: true
    channel_id?: true
    event_type?: true
    processed?: true
    processing_error?: true
    created_at?: true
  }

  export type WebhookEventCountAggregateInputType = {
    id?: true
    channel_id?: true
    event_type?: true
    payload?: true
    processed?: true
    processing_error?: true
    created_at?: true
    _all?: true
  }

  export type WebhookEventAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which WebhookEvent to aggregate.
     */
    where?: WebhookEventWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of WebhookEvents to fetch.
     */
    orderBy?: WebhookEventOrderByWithRelationInput | WebhookEventOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: WebhookEventWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` WebhookEvents from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` WebhookEvents.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned WebhookEvents
    **/
    _count?: true | WebhookEventCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: WebhookEventMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: WebhookEventMaxAggregateInputType
  }

  export type GetWebhookEventAggregateType<T extends WebhookEventAggregateArgs> = {
        [P in keyof T & keyof AggregateWebhookEvent]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateWebhookEvent[P]>
      : GetScalarType<T[P], AggregateWebhookEvent[P]>
  }




  export type WebhookEventGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: WebhookEventWhereInput
    orderBy?: WebhookEventOrderByWithAggregationInput | WebhookEventOrderByWithAggregationInput[]
    by: WebhookEventScalarFieldEnum[] | WebhookEventScalarFieldEnum
    having?: WebhookEventScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: WebhookEventCountAggregateInputType | true
    _min?: WebhookEventMinAggregateInputType
    _max?: WebhookEventMaxAggregateInputType
  }

  export type WebhookEventGroupByOutputType = {
    id: string
    channel_id: string
    event_type: string
    payload: JsonValue
    processed: boolean
    processing_error: string | null
    created_at: Date
    _count: WebhookEventCountAggregateOutputType | null
    _min: WebhookEventMinAggregateOutputType | null
    _max: WebhookEventMaxAggregateOutputType | null
  }

  type GetWebhookEventGroupByPayload<T extends WebhookEventGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<WebhookEventGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof WebhookEventGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], WebhookEventGroupByOutputType[P]>
            : GetScalarType<T[P], WebhookEventGroupByOutputType[P]>
        }
      >
    >


  export type WebhookEventSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    channel_id?: boolean
    event_type?: boolean
    payload?: boolean
    processed?: boolean
    processing_error?: boolean
    created_at?: boolean
    channel?: boolean | ChannelDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["webhookEvent"]>

  export type WebhookEventSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    channel_id?: boolean
    event_type?: boolean
    payload?: boolean
    processed?: boolean
    processing_error?: boolean
    created_at?: boolean
    channel?: boolean | ChannelDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["webhookEvent"]>

  export type WebhookEventSelectScalar = {
    id?: boolean
    channel_id?: boolean
    event_type?: boolean
    payload?: boolean
    processed?: boolean
    processing_error?: boolean
    created_at?: boolean
  }

  export type WebhookEventInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    channel?: boolean | ChannelDefaultArgs<ExtArgs>
  }
  export type WebhookEventIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    channel?: boolean | ChannelDefaultArgs<ExtArgs>
  }

  export type $WebhookEventPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "WebhookEvent"
    objects: {
      channel: Prisma.$ChannelPayload<ExtArgs>
    }
    scalars: $Extensions.GetPayloadResult<{
      id: string
      channel_id: string
      event_type: string
      payload: Prisma.JsonValue
      processed: boolean
      processing_error: string | null
      created_at: Date
    }, ExtArgs["result"]["webhookEvent"]>
    composites: {}
  }

  type WebhookEventGetPayload<S extends boolean | null | undefined | WebhookEventDefaultArgs> = $Result.GetResult<Prisma.$WebhookEventPayload, S>

  type WebhookEventCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = 
    Omit<WebhookEventFindManyArgs, 'select' | 'include' | 'distinct'> & {
      select?: WebhookEventCountAggregateInputType | true
    }

  export interface WebhookEventDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['WebhookEvent'], meta: { name: 'WebhookEvent' } }
    /**
     * Find zero or one WebhookEvent that matches the filter.
     * @param {WebhookEventFindUniqueArgs} args - Arguments to find a WebhookEvent
     * @example
     * // Get one WebhookEvent
     * const webhookEvent = await prisma.webhookEvent.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends WebhookEventFindUniqueArgs>(args: SelectSubset<T, WebhookEventFindUniqueArgs<ExtArgs>>): Prisma__WebhookEventClient<$Result.GetResult<Prisma.$WebhookEventPayload<ExtArgs>, T, "findUnique"> | null, null, ExtArgs>

    /**
     * Find one WebhookEvent that matches the filter or throw an error with `error.code='P2025'` 
     * if no matches were found.
     * @param {WebhookEventFindUniqueOrThrowArgs} args - Arguments to find a WebhookEvent
     * @example
     * // Get one WebhookEvent
     * const webhookEvent = await prisma.webhookEvent.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends WebhookEventFindUniqueOrThrowArgs>(args: SelectSubset<T, WebhookEventFindUniqueOrThrowArgs<ExtArgs>>): Prisma__WebhookEventClient<$Result.GetResult<Prisma.$WebhookEventPayload<ExtArgs>, T, "findUniqueOrThrow">, never, ExtArgs>

    /**
     * Find the first WebhookEvent that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {WebhookEventFindFirstArgs} args - Arguments to find a WebhookEvent
     * @example
     * // Get one WebhookEvent
     * const webhookEvent = await prisma.webhookEvent.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends WebhookEventFindFirstArgs>(args?: SelectSubset<T, WebhookEventFindFirstArgs<ExtArgs>>): Prisma__WebhookEventClient<$Result.GetResult<Prisma.$WebhookEventPayload<ExtArgs>, T, "findFirst"> | null, null, ExtArgs>

    /**
     * Find the first WebhookEvent that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {WebhookEventFindFirstOrThrowArgs} args - Arguments to find a WebhookEvent
     * @example
     * // Get one WebhookEvent
     * const webhookEvent = await prisma.webhookEvent.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends WebhookEventFindFirstOrThrowArgs>(args?: SelectSubset<T, WebhookEventFindFirstOrThrowArgs<ExtArgs>>): Prisma__WebhookEventClient<$Result.GetResult<Prisma.$WebhookEventPayload<ExtArgs>, T, "findFirstOrThrow">, never, ExtArgs>

    /**
     * Find zero or more WebhookEvents that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {WebhookEventFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all WebhookEvents
     * const webhookEvents = await prisma.webhookEvent.findMany()
     * 
     * // Get first 10 WebhookEvents
     * const webhookEvents = await prisma.webhookEvent.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const webhookEventWithIdOnly = await prisma.webhookEvent.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends WebhookEventFindManyArgs>(args?: SelectSubset<T, WebhookEventFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$WebhookEventPayload<ExtArgs>, T, "findMany">>

    /**
     * Create a WebhookEvent.
     * @param {WebhookEventCreateArgs} args - Arguments to create a WebhookEvent.
     * @example
     * // Create one WebhookEvent
     * const WebhookEvent = await prisma.webhookEvent.create({
     *   data: {
     *     // ... data to create a WebhookEvent
     *   }
     * })
     * 
     */
    create<T extends WebhookEventCreateArgs>(args: SelectSubset<T, WebhookEventCreateArgs<ExtArgs>>): Prisma__WebhookEventClient<$Result.GetResult<Prisma.$WebhookEventPayload<ExtArgs>, T, "create">, never, ExtArgs>

    /**
     * Create many WebhookEvents.
     * @param {WebhookEventCreateManyArgs} args - Arguments to create many WebhookEvents.
     * @example
     * // Create many WebhookEvents
     * const webhookEvent = await prisma.webhookEvent.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends WebhookEventCreateManyArgs>(args?: SelectSubset<T, WebhookEventCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many WebhookEvents and returns the data saved in the database.
     * @param {WebhookEventCreateManyAndReturnArgs} args - Arguments to create many WebhookEvents.
     * @example
     * // Create many WebhookEvents
     * const webhookEvent = await prisma.webhookEvent.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many WebhookEvents and only return the `id`
     * const webhookEventWithIdOnly = await prisma.webhookEvent.createManyAndReturn({ 
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends WebhookEventCreateManyAndReturnArgs>(args?: SelectSubset<T, WebhookEventCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$WebhookEventPayload<ExtArgs>, T, "createManyAndReturn">>

    /**
     * Delete a WebhookEvent.
     * @param {WebhookEventDeleteArgs} args - Arguments to delete one WebhookEvent.
     * @example
     * // Delete one WebhookEvent
     * const WebhookEvent = await prisma.webhookEvent.delete({
     *   where: {
     *     // ... filter to delete one WebhookEvent
     *   }
     * })
     * 
     */
    delete<T extends WebhookEventDeleteArgs>(args: SelectSubset<T, WebhookEventDeleteArgs<ExtArgs>>): Prisma__WebhookEventClient<$Result.GetResult<Prisma.$WebhookEventPayload<ExtArgs>, T, "delete">, never, ExtArgs>

    /**
     * Update one WebhookEvent.
     * @param {WebhookEventUpdateArgs} args - Arguments to update one WebhookEvent.
     * @example
     * // Update one WebhookEvent
     * const webhookEvent = await prisma.webhookEvent.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends WebhookEventUpdateArgs>(args: SelectSubset<T, WebhookEventUpdateArgs<ExtArgs>>): Prisma__WebhookEventClient<$Result.GetResult<Prisma.$WebhookEventPayload<ExtArgs>, T, "update">, never, ExtArgs>

    /**
     * Delete zero or more WebhookEvents.
     * @param {WebhookEventDeleteManyArgs} args - Arguments to filter WebhookEvents to delete.
     * @example
     * // Delete a few WebhookEvents
     * const { count } = await prisma.webhookEvent.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends WebhookEventDeleteManyArgs>(args?: SelectSubset<T, WebhookEventDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more WebhookEvents.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {WebhookEventUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many WebhookEvents
     * const webhookEvent = await prisma.webhookEvent.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends WebhookEventUpdateManyArgs>(args: SelectSubset<T, WebhookEventUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create or update one WebhookEvent.
     * @param {WebhookEventUpsertArgs} args - Arguments to update or create a WebhookEvent.
     * @example
     * // Update or create a WebhookEvent
     * const webhookEvent = await prisma.webhookEvent.upsert({
     *   create: {
     *     // ... data to create a WebhookEvent
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the WebhookEvent we want to update
     *   }
     * })
     */
    upsert<T extends WebhookEventUpsertArgs>(args: SelectSubset<T, WebhookEventUpsertArgs<ExtArgs>>): Prisma__WebhookEventClient<$Result.GetResult<Prisma.$WebhookEventPayload<ExtArgs>, T, "upsert">, never, ExtArgs>


    /**
     * Count the number of WebhookEvents.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {WebhookEventCountArgs} args - Arguments to filter WebhookEvents to count.
     * @example
     * // Count the number of WebhookEvents
     * const count = await prisma.webhookEvent.count({
     *   where: {
     *     // ... the filter for the WebhookEvents we want to count
     *   }
     * })
    **/
    count<T extends WebhookEventCountArgs>(
      args?: Subset<T, WebhookEventCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], WebhookEventCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a WebhookEvent.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {WebhookEventAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends WebhookEventAggregateArgs>(args: Subset<T, WebhookEventAggregateArgs>): Prisma.PrismaPromise<GetWebhookEventAggregateType<T>>

    /**
     * Group by WebhookEvent.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {WebhookEventGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends WebhookEventGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: WebhookEventGroupByArgs['orderBy'] }
        : { orderBy?: WebhookEventGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, WebhookEventGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetWebhookEventGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the WebhookEvent model
   */
  readonly fields: WebhookEventFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for WebhookEvent.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__WebhookEventClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    channel<T extends ChannelDefaultArgs<ExtArgs> = {}>(args?: Subset<T, ChannelDefaultArgs<ExtArgs>>): Prisma__ChannelClient<$Result.GetResult<Prisma.$ChannelPayload<ExtArgs>, T, "findUniqueOrThrow"> | Null, Null, ExtArgs>
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the WebhookEvent model
   */ 
  interface WebhookEventFieldRefs {
    readonly id: FieldRef<"WebhookEvent", 'String'>
    readonly channel_id: FieldRef<"WebhookEvent", 'String'>
    readonly event_type: FieldRef<"WebhookEvent", 'String'>
    readonly payload: FieldRef<"WebhookEvent", 'Json'>
    readonly processed: FieldRef<"WebhookEvent", 'Boolean'>
    readonly processing_error: FieldRef<"WebhookEvent", 'String'>
    readonly created_at: FieldRef<"WebhookEvent", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * WebhookEvent findUnique
   */
  export type WebhookEventFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the WebhookEvent
     */
    select?: WebhookEventSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: WebhookEventInclude<ExtArgs> | null
    /**
     * Filter, which WebhookEvent to fetch.
     */
    where: WebhookEventWhereUniqueInput
  }

  /**
   * WebhookEvent findUniqueOrThrow
   */
  export type WebhookEventFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the WebhookEvent
     */
    select?: WebhookEventSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: WebhookEventInclude<ExtArgs> | null
    /**
     * Filter, which WebhookEvent to fetch.
     */
    where: WebhookEventWhereUniqueInput
  }

  /**
   * WebhookEvent findFirst
   */
  export type WebhookEventFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the WebhookEvent
     */
    select?: WebhookEventSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: WebhookEventInclude<ExtArgs> | null
    /**
     * Filter, which WebhookEvent to fetch.
     */
    where?: WebhookEventWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of WebhookEvents to fetch.
     */
    orderBy?: WebhookEventOrderByWithRelationInput | WebhookEventOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for WebhookEvents.
     */
    cursor?: WebhookEventWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` WebhookEvents from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` WebhookEvents.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of WebhookEvents.
     */
    distinct?: WebhookEventScalarFieldEnum | WebhookEventScalarFieldEnum[]
  }

  /**
   * WebhookEvent findFirstOrThrow
   */
  export type WebhookEventFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the WebhookEvent
     */
    select?: WebhookEventSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: WebhookEventInclude<ExtArgs> | null
    /**
     * Filter, which WebhookEvent to fetch.
     */
    where?: WebhookEventWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of WebhookEvents to fetch.
     */
    orderBy?: WebhookEventOrderByWithRelationInput | WebhookEventOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for WebhookEvents.
     */
    cursor?: WebhookEventWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` WebhookEvents from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` WebhookEvents.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of WebhookEvents.
     */
    distinct?: WebhookEventScalarFieldEnum | WebhookEventScalarFieldEnum[]
  }

  /**
   * WebhookEvent findMany
   */
  export type WebhookEventFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the WebhookEvent
     */
    select?: WebhookEventSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: WebhookEventInclude<ExtArgs> | null
    /**
     * Filter, which WebhookEvents to fetch.
     */
    where?: WebhookEventWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of WebhookEvents to fetch.
     */
    orderBy?: WebhookEventOrderByWithRelationInput | WebhookEventOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing WebhookEvents.
     */
    cursor?: WebhookEventWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` WebhookEvents from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` WebhookEvents.
     */
    skip?: number
    distinct?: WebhookEventScalarFieldEnum | WebhookEventScalarFieldEnum[]
  }

  /**
   * WebhookEvent create
   */
  export type WebhookEventCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the WebhookEvent
     */
    select?: WebhookEventSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: WebhookEventInclude<ExtArgs> | null
    /**
     * The data needed to create a WebhookEvent.
     */
    data: XOR<WebhookEventCreateInput, WebhookEventUncheckedCreateInput>
  }

  /**
   * WebhookEvent createMany
   */
  export type WebhookEventCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many WebhookEvents.
     */
    data: WebhookEventCreateManyInput | WebhookEventCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * WebhookEvent createManyAndReturn
   */
  export type WebhookEventCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the WebhookEvent
     */
    select?: WebhookEventSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * The data used to create many WebhookEvents.
     */
    data: WebhookEventCreateManyInput | WebhookEventCreateManyInput[]
    skipDuplicates?: boolean
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: WebhookEventIncludeCreateManyAndReturn<ExtArgs> | null
  }

  /**
   * WebhookEvent update
   */
  export type WebhookEventUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the WebhookEvent
     */
    select?: WebhookEventSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: WebhookEventInclude<ExtArgs> | null
    /**
     * The data needed to update a WebhookEvent.
     */
    data: XOR<WebhookEventUpdateInput, WebhookEventUncheckedUpdateInput>
    /**
     * Choose, which WebhookEvent to update.
     */
    where: WebhookEventWhereUniqueInput
  }

  /**
   * WebhookEvent updateMany
   */
  export type WebhookEventUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update WebhookEvents.
     */
    data: XOR<WebhookEventUpdateManyMutationInput, WebhookEventUncheckedUpdateManyInput>
    /**
     * Filter which WebhookEvents to update
     */
    where?: WebhookEventWhereInput
  }

  /**
   * WebhookEvent upsert
   */
  export type WebhookEventUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the WebhookEvent
     */
    select?: WebhookEventSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: WebhookEventInclude<ExtArgs> | null
    /**
     * The filter to search for the WebhookEvent to update in case it exists.
     */
    where: WebhookEventWhereUniqueInput
    /**
     * In case the WebhookEvent found by the `where` argument doesn't exist, create a new WebhookEvent with this data.
     */
    create: XOR<WebhookEventCreateInput, WebhookEventUncheckedCreateInput>
    /**
     * In case the WebhookEvent was found with the provided `where` argument, update it with this data.
     */
    update: XOR<WebhookEventUpdateInput, WebhookEventUncheckedUpdateInput>
  }

  /**
   * WebhookEvent delete
   */
  export type WebhookEventDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the WebhookEvent
     */
    select?: WebhookEventSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: WebhookEventInclude<ExtArgs> | null
    /**
     * Filter which WebhookEvent to delete.
     */
    where: WebhookEventWhereUniqueInput
  }

  /**
   * WebhookEvent deleteMany
   */
  export type WebhookEventDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which WebhookEvents to delete
     */
    where?: WebhookEventWhereInput
  }

  /**
   * WebhookEvent without action
   */
  export type WebhookEventDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the WebhookEvent
     */
    select?: WebhookEventSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: WebhookEventInclude<ExtArgs> | null
  }


  /**
   * Enums
   */

  export const TransactionIsolationLevel: {
    ReadUncommitted: 'ReadUncommitted',
    ReadCommitted: 'ReadCommitted',
    RepeatableRead: 'RepeatableRead',
    Serializable: 'Serializable'
  };

  export type TransactionIsolationLevel = (typeof TransactionIsolationLevel)[keyof typeof TransactionIsolationLevel]


  export const CompanyScalarFieldEnum: {
    id: 'id',
    name: 'name',
    slug: 'slug',
    settings: 'settings',
    created_at: 'created_at',
    updated_at: 'updated_at'
  };

  export type CompanyScalarFieldEnum = (typeof CompanyScalarFieldEnum)[keyof typeof CompanyScalarFieldEnum]


  export const UserScalarFieldEnum: {
    id: 'id',
    email: 'email',
    password_hash: 'password_hash',
    name: 'name',
    role: 'role',
    company_id: 'company_id',
    is_active: 'is_active',
    created_at: 'created_at',
    updated_at: 'updated_at'
  };

  export type UserScalarFieldEnum = (typeof UserScalarFieldEnum)[keyof typeof UserScalarFieldEnum]


  export const ChannelScalarFieldEnum: {
    id: 'id',
    name: 'name',
    type: 'type',
    status: 'status',
    phone_number: 'phone_number',
    instance_id: 'instance_id',
    api_key: 'api_key',
    webhook_url: 'webhook_url',
    settings: 'settings',
    company_id: 'company_id',
    created_at: 'created_at',
    updated_at: 'updated_at'
  };

  export type ChannelScalarFieldEnum = (typeof ChannelScalarFieldEnum)[keyof typeof ChannelScalarFieldEnum]


  export const BotScalarFieldEnum: {
    id: 'id',
    name: 'name',
    description: 'description',
    is_active: 'is_active',
    flow_data: 'flow_data',
    company_id: 'company_id',
    created_at: 'created_at',
    updated_at: 'updated_at'
  };

  export type BotScalarFieldEnum = (typeof BotScalarFieldEnum)[keyof typeof BotScalarFieldEnum]


  export const ChannelBotScalarFieldEnum: {
    id: 'id',
    channel_id: 'channel_id',
    bot_id: 'bot_id',
    is_active: 'is_active',
    trigger_conditions: 'trigger_conditions',
    created_at: 'created_at'
  };

  export type ChannelBotScalarFieldEnum = (typeof ChannelBotScalarFieldEnum)[keyof typeof ChannelBotScalarFieldEnum]


  export const ContactScalarFieldEnum: {
    id: 'id',
    name: 'name',
    phone: 'phone',
    email: 'email',
    avatar_url: 'avatar_url',
    metadata: 'metadata',
    company_id: 'company_id',
    created_at: 'created_at',
    updated_at: 'updated_at'
  };

  export type ContactScalarFieldEnum = (typeof ContactScalarFieldEnum)[keyof typeof ContactScalarFieldEnum]


  export const ConversationScalarFieldEnum: {
    id: 'id',
    contact_id: 'contact_id',
    channel_id: 'channel_id',
    bot_id: 'bot_id',
    status: 'status',
    assigned_to: 'assigned_to',
    last_message_at: 'last_message_at',
    company_id: 'company_id',
    metadata: 'metadata',
    created_at: 'created_at',
    updated_at: 'updated_at'
  };

  export type ConversationScalarFieldEnum = (typeof ConversationScalarFieldEnum)[keyof typeof ConversationScalarFieldEnum]


  export const MessageScalarFieldEnum: {
    id: 'id',
    conversation_id: 'conversation_id',
    content: 'content',
    message_type: 'message_type',
    sender_type: 'sender_type',
    sender_id: 'sender_id',
    external_id: 'external_id',
    metadata: 'metadata',
    created_at: 'created_at'
  };

  export type MessageScalarFieldEnum = (typeof MessageScalarFieldEnum)[keyof typeof MessageScalarFieldEnum]


  export const TicketScalarFieldEnum: {
    id: 'id',
    ticket_number: 'ticket_number',
    conversation_id: 'conversation_id',
    title: 'title',
    description: 'description',
    status: 'status',
    priority: 'priority',
    assigned_to: 'assigned_to',
    form_data: 'form_data',
    company_id: 'company_id',
    created_at: 'created_at',
    updated_at: 'updated_at'
  };

  export type TicketScalarFieldEnum = (typeof TicketScalarFieldEnum)[keyof typeof TicketScalarFieldEnum]


  export const WebhookEventScalarFieldEnum: {
    id: 'id',
    channel_id: 'channel_id',
    event_type: 'event_type',
    payload: 'payload',
    processed: 'processed',
    processing_error: 'processing_error',
    created_at: 'created_at'
  };

  export type WebhookEventScalarFieldEnum = (typeof WebhookEventScalarFieldEnum)[keyof typeof WebhookEventScalarFieldEnum]


  export const SortOrder: {
    asc: 'asc',
    desc: 'desc'
  };

  export type SortOrder = (typeof SortOrder)[keyof typeof SortOrder]


  export const JsonNullValueInput: {
    JsonNull: typeof JsonNull
  };

  export type JsonNullValueInput = (typeof JsonNullValueInput)[keyof typeof JsonNullValueInput]


  export const QueryMode: {
    default: 'default',
    insensitive: 'insensitive'
  };

  export type QueryMode = (typeof QueryMode)[keyof typeof QueryMode]


  export const JsonNullValueFilter: {
    DbNull: typeof DbNull,
    JsonNull: typeof JsonNull,
    AnyNull: typeof AnyNull
  };

  export type JsonNullValueFilter = (typeof JsonNullValueFilter)[keyof typeof JsonNullValueFilter]


  export const NullsOrder: {
    first: 'first',
    last: 'last'
  };

  export type NullsOrder = (typeof NullsOrder)[keyof typeof NullsOrder]


  /**
   * Field references 
   */


  /**
   * Reference to a field of type 'String'
   */
  export type StringFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'String'>
    


  /**
   * Reference to a field of type 'String[]'
   */
  export type ListStringFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'String[]'>
    


  /**
   * Reference to a field of type 'Json'
   */
  export type JsonFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Json'>
    


  /**
   * Reference to a field of type 'DateTime'
   */
  export type DateTimeFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'DateTime'>
    


  /**
   * Reference to a field of type 'DateTime[]'
   */
  export type ListDateTimeFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'DateTime[]'>
    


  /**
   * Reference to a field of type 'Boolean'
   */
  export type BooleanFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Boolean'>
    


  /**
   * Reference to a field of type 'Int'
   */
  export type IntFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Int'>
    


  /**
   * Reference to a field of type 'Int[]'
   */
  export type ListIntFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Int[]'>
    
  /**
   * Deep Input Types
   */


  export type CompanyWhereInput = {
    AND?: CompanyWhereInput | CompanyWhereInput[]
    OR?: CompanyWhereInput[]
    NOT?: CompanyWhereInput | CompanyWhereInput[]
    id?: UuidFilter<"Company"> | string
    name?: StringFilter<"Company"> | string
    slug?: StringFilter<"Company"> | string
    settings?: JsonFilter<"Company">
    created_at?: DateTimeFilter<"Company"> | Date | string
    updated_at?: DateTimeFilter<"Company"> | Date | string
    users?: UserListRelationFilter
    channels?: ChannelListRelationFilter
    bots?: BotListRelationFilter
    contacts?: ContactListRelationFilter
    conversations?: ConversationListRelationFilter
    tickets?: TicketListRelationFilter
  }

  export type CompanyOrderByWithRelationInput = {
    id?: SortOrder
    name?: SortOrder
    slug?: SortOrder
    settings?: SortOrder
    created_at?: SortOrder
    updated_at?: SortOrder
    users?: UserOrderByRelationAggregateInput
    channels?: ChannelOrderByRelationAggregateInput
    bots?: BotOrderByRelationAggregateInput
    contacts?: ContactOrderByRelationAggregateInput
    conversations?: ConversationOrderByRelationAggregateInput
    tickets?: TicketOrderByRelationAggregateInput
  }

  export type CompanyWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    slug?: string
    AND?: CompanyWhereInput | CompanyWhereInput[]
    OR?: CompanyWhereInput[]
    NOT?: CompanyWhereInput | CompanyWhereInput[]
    name?: StringFilter<"Company"> | string
    settings?: JsonFilter<"Company">
    created_at?: DateTimeFilter<"Company"> | Date | string
    updated_at?: DateTimeFilter<"Company"> | Date | string
    users?: UserListRelationFilter
    channels?: ChannelListRelationFilter
    bots?: BotListRelationFilter
    contacts?: ContactListRelationFilter
    conversations?: ConversationListRelationFilter
    tickets?: TicketListRelationFilter
  }, "id" | "slug">

  export type CompanyOrderByWithAggregationInput = {
    id?: SortOrder
    name?: SortOrder
    slug?: SortOrder
    settings?: SortOrder
    created_at?: SortOrder
    updated_at?: SortOrder
    _count?: CompanyCountOrderByAggregateInput
    _max?: CompanyMaxOrderByAggregateInput
    _min?: CompanyMinOrderByAggregateInput
  }

  export type CompanyScalarWhereWithAggregatesInput = {
    AND?: CompanyScalarWhereWithAggregatesInput | CompanyScalarWhereWithAggregatesInput[]
    OR?: CompanyScalarWhereWithAggregatesInput[]
    NOT?: CompanyScalarWhereWithAggregatesInput | CompanyScalarWhereWithAggregatesInput[]
    id?: UuidWithAggregatesFilter<"Company"> | string
    name?: StringWithAggregatesFilter<"Company"> | string
    slug?: StringWithAggregatesFilter<"Company"> | string
    settings?: JsonWithAggregatesFilter<"Company">
    created_at?: DateTimeWithAggregatesFilter<"Company"> | Date | string
    updated_at?: DateTimeWithAggregatesFilter<"Company"> | Date | string
  }

  export type UserWhereInput = {
    AND?: UserWhereInput | UserWhereInput[]
    OR?: UserWhereInput[]
    NOT?: UserWhereInput | UserWhereInput[]
    id?: UuidFilter<"User"> | string
    email?: StringFilter<"User"> | string
    password_hash?: StringFilter<"User"> | string
    name?: StringFilter<"User"> | string
    role?: StringFilter<"User"> | string
    company_id?: UuidFilter<"User"> | string
    is_active?: BoolFilter<"User"> | boolean
    created_at?: DateTimeFilter<"User"> | Date | string
    updated_at?: DateTimeFilter<"User"> | Date | string
    company?: XOR<CompanyRelationFilter, CompanyWhereInput>
    assigned_conversations?: ConversationListRelationFilter
    assigned_tickets?: TicketListRelationFilter
  }

  export type UserOrderByWithRelationInput = {
    id?: SortOrder
    email?: SortOrder
    password_hash?: SortOrder
    name?: SortOrder
    role?: SortOrder
    company_id?: SortOrder
    is_active?: SortOrder
    created_at?: SortOrder
    updated_at?: SortOrder
    company?: CompanyOrderByWithRelationInput
    assigned_conversations?: ConversationOrderByRelationAggregateInput
    assigned_tickets?: TicketOrderByRelationAggregateInput
  }

  export type UserWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    email?: string
    AND?: UserWhereInput | UserWhereInput[]
    OR?: UserWhereInput[]
    NOT?: UserWhereInput | UserWhereInput[]
    password_hash?: StringFilter<"User"> | string
    name?: StringFilter<"User"> | string
    role?: StringFilter<"User"> | string
    company_id?: UuidFilter<"User"> | string
    is_active?: BoolFilter<"User"> | boolean
    created_at?: DateTimeFilter<"User"> | Date | string
    updated_at?: DateTimeFilter<"User"> | Date | string
    company?: XOR<CompanyRelationFilter, CompanyWhereInput>
    assigned_conversations?: ConversationListRelationFilter
    assigned_tickets?: TicketListRelationFilter
  }, "id" | "email">

  export type UserOrderByWithAggregationInput = {
    id?: SortOrder
    email?: SortOrder
    password_hash?: SortOrder
    name?: SortOrder
    role?: SortOrder
    company_id?: SortOrder
    is_active?: SortOrder
    created_at?: SortOrder
    updated_at?: SortOrder
    _count?: UserCountOrderByAggregateInput
    _max?: UserMaxOrderByAggregateInput
    _min?: UserMinOrderByAggregateInput
  }

  export type UserScalarWhereWithAggregatesInput = {
    AND?: UserScalarWhereWithAggregatesInput | UserScalarWhereWithAggregatesInput[]
    OR?: UserScalarWhereWithAggregatesInput[]
    NOT?: UserScalarWhereWithAggregatesInput | UserScalarWhereWithAggregatesInput[]
    id?: UuidWithAggregatesFilter<"User"> | string
    email?: StringWithAggregatesFilter<"User"> | string
    password_hash?: StringWithAggregatesFilter<"User"> | string
    name?: StringWithAggregatesFilter<"User"> | string
    role?: StringWithAggregatesFilter<"User"> | string
    company_id?: UuidWithAggregatesFilter<"User"> | string
    is_active?: BoolWithAggregatesFilter<"User"> | boolean
    created_at?: DateTimeWithAggregatesFilter<"User"> | Date | string
    updated_at?: DateTimeWithAggregatesFilter<"User"> | Date | string
  }

  export type ChannelWhereInput = {
    AND?: ChannelWhereInput | ChannelWhereInput[]
    OR?: ChannelWhereInput[]
    NOT?: ChannelWhereInput | ChannelWhereInput[]
    id?: UuidFilter<"Channel"> | string
    name?: StringFilter<"Channel"> | string
    type?: StringFilter<"Channel"> | string
    status?: StringFilter<"Channel"> | string
    phone_number?: StringNullableFilter<"Channel"> | string | null
    instance_id?: StringNullableFilter<"Channel"> | string | null
    api_key?: StringNullableFilter<"Channel"> | string | null
    webhook_url?: StringNullableFilter<"Channel"> | string | null
    settings?: JsonFilter<"Channel">
    company_id?: UuidFilter<"Channel"> | string
    created_at?: DateTimeFilter<"Channel"> | Date | string
    updated_at?: DateTimeFilter<"Channel"> | Date | string
    company?: XOR<CompanyRelationFilter, CompanyWhereInput>
    conversations?: ConversationListRelationFilter
    channel_bots?: ChannelBotListRelationFilter
    webhook_events?: WebhookEventListRelationFilter
  }

  export type ChannelOrderByWithRelationInput = {
    id?: SortOrder
    name?: SortOrder
    type?: SortOrder
    status?: SortOrder
    phone_number?: SortOrderInput | SortOrder
    instance_id?: SortOrderInput | SortOrder
    api_key?: SortOrderInput | SortOrder
    webhook_url?: SortOrderInput | SortOrder
    settings?: SortOrder
    company_id?: SortOrder
    created_at?: SortOrder
    updated_at?: SortOrder
    company?: CompanyOrderByWithRelationInput
    conversations?: ConversationOrderByRelationAggregateInput
    channel_bots?: ChannelBotOrderByRelationAggregateInput
    webhook_events?: WebhookEventOrderByRelationAggregateInput
  }

  export type ChannelWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    name_company_id?: ChannelName_company_idCompoundUniqueInput
    AND?: ChannelWhereInput | ChannelWhereInput[]
    OR?: ChannelWhereInput[]
    NOT?: ChannelWhereInput | ChannelWhereInput[]
    name?: StringFilter<"Channel"> | string
    type?: StringFilter<"Channel"> | string
    status?: StringFilter<"Channel"> | string
    phone_number?: StringNullableFilter<"Channel"> | string | null
    instance_id?: StringNullableFilter<"Channel"> | string | null
    api_key?: StringNullableFilter<"Channel"> | string | null
    webhook_url?: StringNullableFilter<"Channel"> | string | null
    settings?: JsonFilter<"Channel">
    company_id?: UuidFilter<"Channel"> | string
    created_at?: DateTimeFilter<"Channel"> | Date | string
    updated_at?: DateTimeFilter<"Channel"> | Date | string
    company?: XOR<CompanyRelationFilter, CompanyWhereInput>
    conversations?: ConversationListRelationFilter
    channel_bots?: ChannelBotListRelationFilter
    webhook_events?: WebhookEventListRelationFilter
  }, "id" | "name_company_id">

  export type ChannelOrderByWithAggregationInput = {
    id?: SortOrder
    name?: SortOrder
    type?: SortOrder
    status?: SortOrder
    phone_number?: SortOrderInput | SortOrder
    instance_id?: SortOrderInput | SortOrder
    api_key?: SortOrderInput | SortOrder
    webhook_url?: SortOrderInput | SortOrder
    settings?: SortOrder
    company_id?: SortOrder
    created_at?: SortOrder
    updated_at?: SortOrder
    _count?: ChannelCountOrderByAggregateInput
    _max?: ChannelMaxOrderByAggregateInput
    _min?: ChannelMinOrderByAggregateInput
  }

  export type ChannelScalarWhereWithAggregatesInput = {
    AND?: ChannelScalarWhereWithAggregatesInput | ChannelScalarWhereWithAggregatesInput[]
    OR?: ChannelScalarWhereWithAggregatesInput[]
    NOT?: ChannelScalarWhereWithAggregatesInput | ChannelScalarWhereWithAggregatesInput[]
    id?: UuidWithAggregatesFilter<"Channel"> | string
    name?: StringWithAggregatesFilter<"Channel"> | string
    type?: StringWithAggregatesFilter<"Channel"> | string
    status?: StringWithAggregatesFilter<"Channel"> | string
    phone_number?: StringNullableWithAggregatesFilter<"Channel"> | string | null
    instance_id?: StringNullableWithAggregatesFilter<"Channel"> | string | null
    api_key?: StringNullableWithAggregatesFilter<"Channel"> | string | null
    webhook_url?: StringNullableWithAggregatesFilter<"Channel"> | string | null
    settings?: JsonWithAggregatesFilter<"Channel">
    company_id?: UuidWithAggregatesFilter<"Channel"> | string
    created_at?: DateTimeWithAggregatesFilter<"Channel"> | Date | string
    updated_at?: DateTimeWithAggregatesFilter<"Channel"> | Date | string
  }

  export type BotWhereInput = {
    AND?: BotWhereInput | BotWhereInput[]
    OR?: BotWhereInput[]
    NOT?: BotWhereInput | BotWhereInput[]
    id?: UuidFilter<"Bot"> | string
    name?: StringFilter<"Bot"> | string
    description?: StringNullableFilter<"Bot"> | string | null
    is_active?: BoolFilter<"Bot"> | boolean
    flow_data?: JsonFilter<"Bot">
    company_id?: UuidFilter<"Bot"> | string
    created_at?: DateTimeFilter<"Bot"> | Date | string
    updated_at?: DateTimeFilter<"Bot"> | Date | string
    company?: XOR<CompanyRelationFilter, CompanyWhereInput>
    conversations?: ConversationListRelationFilter
    channel_bots?: ChannelBotListRelationFilter
  }

  export type BotOrderByWithRelationInput = {
    id?: SortOrder
    name?: SortOrder
    description?: SortOrderInput | SortOrder
    is_active?: SortOrder
    flow_data?: SortOrder
    company_id?: SortOrder
    created_at?: SortOrder
    updated_at?: SortOrder
    company?: CompanyOrderByWithRelationInput
    conversations?: ConversationOrderByRelationAggregateInput
    channel_bots?: ChannelBotOrderByRelationAggregateInput
  }

  export type BotWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    AND?: BotWhereInput | BotWhereInput[]
    OR?: BotWhereInput[]
    NOT?: BotWhereInput | BotWhereInput[]
    name?: StringFilter<"Bot"> | string
    description?: StringNullableFilter<"Bot"> | string | null
    is_active?: BoolFilter<"Bot"> | boolean
    flow_data?: JsonFilter<"Bot">
    company_id?: UuidFilter<"Bot"> | string
    created_at?: DateTimeFilter<"Bot"> | Date | string
    updated_at?: DateTimeFilter<"Bot"> | Date | string
    company?: XOR<CompanyRelationFilter, CompanyWhereInput>
    conversations?: ConversationListRelationFilter
    channel_bots?: ChannelBotListRelationFilter
  }, "id">

  export type BotOrderByWithAggregationInput = {
    id?: SortOrder
    name?: SortOrder
    description?: SortOrderInput | SortOrder
    is_active?: SortOrder
    flow_data?: SortOrder
    company_id?: SortOrder
    created_at?: SortOrder
    updated_at?: SortOrder
    _count?: BotCountOrderByAggregateInput
    _max?: BotMaxOrderByAggregateInput
    _min?: BotMinOrderByAggregateInput
  }

  export type BotScalarWhereWithAggregatesInput = {
    AND?: BotScalarWhereWithAggregatesInput | BotScalarWhereWithAggregatesInput[]
    OR?: BotScalarWhereWithAggregatesInput[]
    NOT?: BotScalarWhereWithAggregatesInput | BotScalarWhereWithAggregatesInput[]
    id?: UuidWithAggregatesFilter<"Bot"> | string
    name?: StringWithAggregatesFilter<"Bot"> | string
    description?: StringNullableWithAggregatesFilter<"Bot"> | string | null
    is_active?: BoolWithAggregatesFilter<"Bot"> | boolean
    flow_data?: JsonWithAggregatesFilter<"Bot">
    company_id?: UuidWithAggregatesFilter<"Bot"> | string
    created_at?: DateTimeWithAggregatesFilter<"Bot"> | Date | string
    updated_at?: DateTimeWithAggregatesFilter<"Bot"> | Date | string
  }

  export type ChannelBotWhereInput = {
    AND?: ChannelBotWhereInput | ChannelBotWhereInput[]
    OR?: ChannelBotWhereInput[]
    NOT?: ChannelBotWhereInput | ChannelBotWhereInput[]
    id?: UuidFilter<"ChannelBot"> | string
    channel_id?: UuidFilter<"ChannelBot"> | string
    bot_id?: UuidFilter<"ChannelBot"> | string
    is_active?: BoolFilter<"ChannelBot"> | boolean
    trigger_conditions?: JsonFilter<"ChannelBot">
    created_at?: DateTimeFilter<"ChannelBot"> | Date | string
    channel?: XOR<ChannelRelationFilter, ChannelWhereInput>
    bot?: XOR<BotRelationFilter, BotWhereInput>
  }

  export type ChannelBotOrderByWithRelationInput = {
    id?: SortOrder
    channel_id?: SortOrder
    bot_id?: SortOrder
    is_active?: SortOrder
    trigger_conditions?: SortOrder
    created_at?: SortOrder
    channel?: ChannelOrderByWithRelationInput
    bot?: BotOrderByWithRelationInput
  }

  export type ChannelBotWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    channel_id_bot_id?: ChannelBotChannel_idBot_idCompoundUniqueInput
    AND?: ChannelBotWhereInput | ChannelBotWhereInput[]
    OR?: ChannelBotWhereInput[]
    NOT?: ChannelBotWhereInput | ChannelBotWhereInput[]
    channel_id?: UuidFilter<"ChannelBot"> | string
    bot_id?: UuidFilter<"ChannelBot"> | string
    is_active?: BoolFilter<"ChannelBot"> | boolean
    trigger_conditions?: JsonFilter<"ChannelBot">
    created_at?: DateTimeFilter<"ChannelBot"> | Date | string
    channel?: XOR<ChannelRelationFilter, ChannelWhereInput>
    bot?: XOR<BotRelationFilter, BotWhereInput>
  }, "id" | "channel_id_bot_id">

  export type ChannelBotOrderByWithAggregationInput = {
    id?: SortOrder
    channel_id?: SortOrder
    bot_id?: SortOrder
    is_active?: SortOrder
    trigger_conditions?: SortOrder
    created_at?: SortOrder
    _count?: ChannelBotCountOrderByAggregateInput
    _max?: ChannelBotMaxOrderByAggregateInput
    _min?: ChannelBotMinOrderByAggregateInput
  }

  export type ChannelBotScalarWhereWithAggregatesInput = {
    AND?: ChannelBotScalarWhereWithAggregatesInput | ChannelBotScalarWhereWithAggregatesInput[]
    OR?: ChannelBotScalarWhereWithAggregatesInput[]
    NOT?: ChannelBotScalarWhereWithAggregatesInput | ChannelBotScalarWhereWithAggregatesInput[]
    id?: UuidWithAggregatesFilter<"ChannelBot"> | string
    channel_id?: UuidWithAggregatesFilter<"ChannelBot"> | string
    bot_id?: UuidWithAggregatesFilter<"ChannelBot"> | string
    is_active?: BoolWithAggregatesFilter<"ChannelBot"> | boolean
    trigger_conditions?: JsonWithAggregatesFilter<"ChannelBot">
    created_at?: DateTimeWithAggregatesFilter<"ChannelBot"> | Date | string
  }

  export type ContactWhereInput = {
    AND?: ContactWhereInput | ContactWhereInput[]
    OR?: ContactWhereInput[]
    NOT?: ContactWhereInput | ContactWhereInput[]
    id?: UuidFilter<"Contact"> | string
    name?: StringNullableFilter<"Contact"> | string | null
    phone?: StringFilter<"Contact"> | string
    email?: StringNullableFilter<"Contact"> | string | null
    avatar_url?: StringNullableFilter<"Contact"> | string | null
    metadata?: JsonFilter<"Contact">
    company_id?: UuidFilter<"Contact"> | string
    created_at?: DateTimeFilter<"Contact"> | Date | string
    updated_at?: DateTimeFilter<"Contact"> | Date | string
    company?: XOR<CompanyRelationFilter, CompanyWhereInput>
    conversations?: ConversationListRelationFilter
  }

  export type ContactOrderByWithRelationInput = {
    id?: SortOrder
    name?: SortOrderInput | SortOrder
    phone?: SortOrder
    email?: SortOrderInput | SortOrder
    avatar_url?: SortOrderInput | SortOrder
    metadata?: SortOrder
    company_id?: SortOrder
    created_at?: SortOrder
    updated_at?: SortOrder
    company?: CompanyOrderByWithRelationInput
    conversations?: ConversationOrderByRelationAggregateInput
  }

  export type ContactWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    phone_company_id?: ContactPhoneCompany_idCompoundUniqueInput
    AND?: ContactWhereInput | ContactWhereInput[]
    OR?: ContactWhereInput[]
    NOT?: ContactWhereInput | ContactWhereInput[]
    name?: StringNullableFilter<"Contact"> | string | null
    phone?: StringFilter<"Contact"> | string
    email?: StringNullableFilter<"Contact"> | string | null
    avatar_url?: StringNullableFilter<"Contact"> | string | null
    metadata?: JsonFilter<"Contact">
    company_id?: UuidFilter<"Contact"> | string
    created_at?: DateTimeFilter<"Contact"> | Date | string
    updated_at?: DateTimeFilter<"Contact"> | Date | string
    company?: XOR<CompanyRelationFilter, CompanyWhereInput>
    conversations?: ConversationListRelationFilter
  }, "id" | "phone_company_id">

  export type ContactOrderByWithAggregationInput = {
    id?: SortOrder
    name?: SortOrderInput | SortOrder
    phone?: SortOrder
    email?: SortOrderInput | SortOrder
    avatar_url?: SortOrderInput | SortOrder
    metadata?: SortOrder
    company_id?: SortOrder
    created_at?: SortOrder
    updated_at?: SortOrder
    _count?: ContactCountOrderByAggregateInput
    _max?: ContactMaxOrderByAggregateInput
    _min?: ContactMinOrderByAggregateInput
  }

  export type ContactScalarWhereWithAggregatesInput = {
    AND?: ContactScalarWhereWithAggregatesInput | ContactScalarWhereWithAggregatesInput[]
    OR?: ContactScalarWhereWithAggregatesInput[]
    NOT?: ContactScalarWhereWithAggregatesInput | ContactScalarWhereWithAggregatesInput[]
    id?: UuidWithAggregatesFilter<"Contact"> | string
    name?: StringNullableWithAggregatesFilter<"Contact"> | string | null
    phone?: StringWithAggregatesFilter<"Contact"> | string
    email?: StringNullableWithAggregatesFilter<"Contact"> | string | null
    avatar_url?: StringNullableWithAggregatesFilter<"Contact"> | string | null
    metadata?: JsonWithAggregatesFilter<"Contact">
    company_id?: UuidWithAggregatesFilter<"Contact"> | string
    created_at?: DateTimeWithAggregatesFilter<"Contact"> | Date | string
    updated_at?: DateTimeWithAggregatesFilter<"Contact"> | Date | string
  }

  export type ConversationWhereInput = {
    AND?: ConversationWhereInput | ConversationWhereInput[]
    OR?: ConversationWhereInput[]
    NOT?: ConversationWhereInput | ConversationWhereInput[]
    id?: UuidFilter<"Conversation"> | string
    contact_id?: UuidFilter<"Conversation"> | string
    channel_id?: UuidFilter<"Conversation"> | string
    bot_id?: UuidNullableFilter<"Conversation"> | string | null
    status?: StringFilter<"Conversation"> | string
    assigned_to?: UuidNullableFilter<"Conversation"> | string | null
    last_message_at?: DateTimeFilter<"Conversation"> | Date | string
    company_id?: UuidFilter<"Conversation"> | string
    metadata?: JsonFilter<"Conversation">
    created_at?: DateTimeFilter<"Conversation"> | Date | string
    updated_at?: DateTimeFilter<"Conversation"> | Date | string
    contact?: XOR<ContactRelationFilter, ContactWhereInput>
    channel?: XOR<ChannelRelationFilter, ChannelWhereInput>
    bot?: XOR<BotNullableRelationFilter, BotWhereInput> | null
    assigned_user?: XOR<UserNullableRelationFilter, UserWhereInput> | null
    company?: XOR<CompanyRelationFilter, CompanyWhereInput>
    messages?: MessageListRelationFilter
    tickets?: TicketListRelationFilter
  }

  export type ConversationOrderByWithRelationInput = {
    id?: SortOrder
    contact_id?: SortOrder
    channel_id?: SortOrder
    bot_id?: SortOrderInput | SortOrder
    status?: SortOrder
    assigned_to?: SortOrderInput | SortOrder
    last_message_at?: SortOrder
    company_id?: SortOrder
    metadata?: SortOrder
    created_at?: SortOrder
    updated_at?: SortOrder
    contact?: ContactOrderByWithRelationInput
    channel?: ChannelOrderByWithRelationInput
    bot?: BotOrderByWithRelationInput
    assigned_user?: UserOrderByWithRelationInput
    company?: CompanyOrderByWithRelationInput
    messages?: MessageOrderByRelationAggregateInput
    tickets?: TicketOrderByRelationAggregateInput
  }

  export type ConversationWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    AND?: ConversationWhereInput | ConversationWhereInput[]
    OR?: ConversationWhereInput[]
    NOT?: ConversationWhereInput | ConversationWhereInput[]
    contact_id?: UuidFilter<"Conversation"> | string
    channel_id?: UuidFilter<"Conversation"> | string
    bot_id?: UuidNullableFilter<"Conversation"> | string | null
    status?: StringFilter<"Conversation"> | string
    assigned_to?: UuidNullableFilter<"Conversation"> | string | null
    last_message_at?: DateTimeFilter<"Conversation"> | Date | string
    company_id?: UuidFilter<"Conversation"> | string
    metadata?: JsonFilter<"Conversation">
    created_at?: DateTimeFilter<"Conversation"> | Date | string
    updated_at?: DateTimeFilter<"Conversation"> | Date | string
    contact?: XOR<ContactRelationFilter, ContactWhereInput>
    channel?: XOR<ChannelRelationFilter, ChannelWhereInput>
    bot?: XOR<BotNullableRelationFilter, BotWhereInput> | null
    assigned_user?: XOR<UserNullableRelationFilter, UserWhereInput> | null
    company?: XOR<CompanyRelationFilter, CompanyWhereInput>
    messages?: MessageListRelationFilter
    tickets?: TicketListRelationFilter
  }, "id">

  export type ConversationOrderByWithAggregationInput = {
    id?: SortOrder
    contact_id?: SortOrder
    channel_id?: SortOrder
    bot_id?: SortOrderInput | SortOrder
    status?: SortOrder
    assigned_to?: SortOrderInput | SortOrder
    last_message_at?: SortOrder
    company_id?: SortOrder
    metadata?: SortOrder
    created_at?: SortOrder
    updated_at?: SortOrder
    _count?: ConversationCountOrderByAggregateInput
    _max?: ConversationMaxOrderByAggregateInput
    _min?: ConversationMinOrderByAggregateInput
  }

  export type ConversationScalarWhereWithAggregatesInput = {
    AND?: ConversationScalarWhereWithAggregatesInput | ConversationScalarWhereWithAggregatesInput[]
    OR?: ConversationScalarWhereWithAggregatesInput[]
    NOT?: ConversationScalarWhereWithAggregatesInput | ConversationScalarWhereWithAggregatesInput[]
    id?: UuidWithAggregatesFilter<"Conversation"> | string
    contact_id?: UuidWithAggregatesFilter<"Conversation"> | string
    channel_id?: UuidWithAggregatesFilter<"Conversation"> | string
    bot_id?: UuidNullableWithAggregatesFilter<"Conversation"> | string | null
    status?: StringWithAggregatesFilter<"Conversation"> | string
    assigned_to?: UuidNullableWithAggregatesFilter<"Conversation"> | string | null
    last_message_at?: DateTimeWithAggregatesFilter<"Conversation"> | Date | string
    company_id?: UuidWithAggregatesFilter<"Conversation"> | string
    metadata?: JsonWithAggregatesFilter<"Conversation">
    created_at?: DateTimeWithAggregatesFilter<"Conversation"> | Date | string
    updated_at?: DateTimeWithAggregatesFilter<"Conversation"> | Date | string
  }

  export type MessageWhereInput = {
    AND?: MessageWhereInput | MessageWhereInput[]
    OR?: MessageWhereInput[]
    NOT?: MessageWhereInput | MessageWhereInput[]
    id?: UuidFilter<"Message"> | string
    conversation_id?: UuidFilter<"Message"> | string
    content?: StringFilter<"Message"> | string
    message_type?: StringFilter<"Message"> | string
    sender_type?: StringFilter<"Message"> | string
    sender_id?: UuidNullableFilter<"Message"> | string | null
    external_id?: StringNullableFilter<"Message"> | string | null
    metadata?: JsonFilter<"Message">
    created_at?: DateTimeFilter<"Message"> | Date | string
    conversation?: XOR<ConversationRelationFilter, ConversationWhereInput>
  }

  export type MessageOrderByWithRelationInput = {
    id?: SortOrder
    conversation_id?: SortOrder
    content?: SortOrder
    message_type?: SortOrder
    sender_type?: SortOrder
    sender_id?: SortOrderInput | SortOrder
    external_id?: SortOrderInput | SortOrder
    metadata?: SortOrder
    created_at?: SortOrder
    conversation?: ConversationOrderByWithRelationInput
  }

  export type MessageWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    AND?: MessageWhereInput | MessageWhereInput[]
    OR?: MessageWhereInput[]
    NOT?: MessageWhereInput | MessageWhereInput[]
    conversation_id?: UuidFilter<"Message"> | string
    content?: StringFilter<"Message"> | string
    message_type?: StringFilter<"Message"> | string
    sender_type?: StringFilter<"Message"> | string
    sender_id?: UuidNullableFilter<"Message"> | string | null
    external_id?: StringNullableFilter<"Message"> | string | null
    metadata?: JsonFilter<"Message">
    created_at?: DateTimeFilter<"Message"> | Date | string
    conversation?: XOR<ConversationRelationFilter, ConversationWhereInput>
  }, "id">

  export type MessageOrderByWithAggregationInput = {
    id?: SortOrder
    conversation_id?: SortOrder
    content?: SortOrder
    message_type?: SortOrder
    sender_type?: SortOrder
    sender_id?: SortOrderInput | SortOrder
    external_id?: SortOrderInput | SortOrder
    metadata?: SortOrder
    created_at?: SortOrder
    _count?: MessageCountOrderByAggregateInput
    _max?: MessageMaxOrderByAggregateInput
    _min?: MessageMinOrderByAggregateInput
  }

  export type MessageScalarWhereWithAggregatesInput = {
    AND?: MessageScalarWhereWithAggregatesInput | MessageScalarWhereWithAggregatesInput[]
    OR?: MessageScalarWhereWithAggregatesInput[]
    NOT?: MessageScalarWhereWithAggregatesInput | MessageScalarWhereWithAggregatesInput[]
    id?: UuidWithAggregatesFilter<"Message"> | string
    conversation_id?: UuidWithAggregatesFilter<"Message"> | string
    content?: StringWithAggregatesFilter<"Message"> | string
    message_type?: StringWithAggregatesFilter<"Message"> | string
    sender_type?: StringWithAggregatesFilter<"Message"> | string
    sender_id?: UuidNullableWithAggregatesFilter<"Message"> | string | null
    external_id?: StringNullableWithAggregatesFilter<"Message"> | string | null
    metadata?: JsonWithAggregatesFilter<"Message">
    created_at?: DateTimeWithAggregatesFilter<"Message"> | Date | string
  }

  export type TicketWhereInput = {
    AND?: TicketWhereInput | TicketWhereInput[]
    OR?: TicketWhereInput[]
    NOT?: TicketWhereInput | TicketWhereInput[]
    id?: UuidFilter<"Ticket"> | string
    ticket_number?: StringFilter<"Ticket"> | string
    conversation_id?: UuidFilter<"Ticket"> | string
    title?: StringFilter<"Ticket"> | string
    description?: StringNullableFilter<"Ticket"> | string | null
    status?: StringFilter<"Ticket"> | string
    priority?: StringFilter<"Ticket"> | string
    assigned_to?: UuidNullableFilter<"Ticket"> | string | null
    form_data?: JsonFilter<"Ticket">
    company_id?: UuidFilter<"Ticket"> | string
    created_at?: DateTimeFilter<"Ticket"> | Date | string
    updated_at?: DateTimeFilter<"Ticket"> | Date | string
    conversation?: XOR<ConversationRelationFilter, ConversationWhereInput>
    assigned_user?: XOR<UserNullableRelationFilter, UserWhereInput> | null
    company?: XOR<CompanyRelationFilter, CompanyWhereInput>
  }

  export type TicketOrderByWithRelationInput = {
    id?: SortOrder
    ticket_number?: SortOrder
    conversation_id?: SortOrder
    title?: SortOrder
    description?: SortOrderInput | SortOrder
    status?: SortOrder
    priority?: SortOrder
    assigned_to?: SortOrderInput | SortOrder
    form_data?: SortOrder
    company_id?: SortOrder
    created_at?: SortOrder
    updated_at?: SortOrder
    conversation?: ConversationOrderByWithRelationInput
    assigned_user?: UserOrderByWithRelationInput
    company?: CompanyOrderByWithRelationInput
  }

  export type TicketWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    ticket_number?: string
    AND?: TicketWhereInput | TicketWhereInput[]
    OR?: TicketWhereInput[]
    NOT?: TicketWhereInput | TicketWhereInput[]
    conversation_id?: UuidFilter<"Ticket"> | string
    title?: StringFilter<"Ticket"> | string
    description?: StringNullableFilter<"Ticket"> | string | null
    status?: StringFilter<"Ticket"> | string
    priority?: StringFilter<"Ticket"> | string
    assigned_to?: UuidNullableFilter<"Ticket"> | string | null
    form_data?: JsonFilter<"Ticket">
    company_id?: UuidFilter<"Ticket"> | string
    created_at?: DateTimeFilter<"Ticket"> | Date | string
    updated_at?: DateTimeFilter<"Ticket"> | Date | string
    conversation?: XOR<ConversationRelationFilter, ConversationWhereInput>
    assigned_user?: XOR<UserNullableRelationFilter, UserWhereInput> | null
    company?: XOR<CompanyRelationFilter, CompanyWhereInput>
  }, "id" | "ticket_number">

  export type TicketOrderByWithAggregationInput = {
    id?: SortOrder
    ticket_number?: SortOrder
    conversation_id?: SortOrder
    title?: SortOrder
    description?: SortOrderInput | SortOrder
    status?: SortOrder
    priority?: SortOrder
    assigned_to?: SortOrderInput | SortOrder
    form_data?: SortOrder
    company_id?: SortOrder
    created_at?: SortOrder
    updated_at?: SortOrder
    _count?: TicketCountOrderByAggregateInput
    _max?: TicketMaxOrderByAggregateInput
    _min?: TicketMinOrderByAggregateInput
  }

  export type TicketScalarWhereWithAggregatesInput = {
    AND?: TicketScalarWhereWithAggregatesInput | TicketScalarWhereWithAggregatesInput[]
    OR?: TicketScalarWhereWithAggregatesInput[]
    NOT?: TicketScalarWhereWithAggregatesInput | TicketScalarWhereWithAggregatesInput[]
    id?: UuidWithAggregatesFilter<"Ticket"> | string
    ticket_number?: StringWithAggregatesFilter<"Ticket"> | string
    conversation_id?: UuidWithAggregatesFilter<"Ticket"> | string
    title?: StringWithAggregatesFilter<"Ticket"> | string
    description?: StringNullableWithAggregatesFilter<"Ticket"> | string | null
    status?: StringWithAggregatesFilter<"Ticket"> | string
    priority?: StringWithAggregatesFilter<"Ticket"> | string
    assigned_to?: UuidNullableWithAggregatesFilter<"Ticket"> | string | null
    form_data?: JsonWithAggregatesFilter<"Ticket">
    company_id?: UuidWithAggregatesFilter<"Ticket"> | string
    created_at?: DateTimeWithAggregatesFilter<"Ticket"> | Date | string
    updated_at?: DateTimeWithAggregatesFilter<"Ticket"> | Date | string
  }

  export type WebhookEventWhereInput = {
    AND?: WebhookEventWhereInput | WebhookEventWhereInput[]
    OR?: WebhookEventWhereInput[]
    NOT?: WebhookEventWhereInput | WebhookEventWhereInput[]
    id?: UuidFilter<"WebhookEvent"> | string
    channel_id?: UuidFilter<"WebhookEvent"> | string
    event_type?: StringFilter<"WebhookEvent"> | string
    payload?: JsonFilter<"WebhookEvent">
    processed?: BoolFilter<"WebhookEvent"> | boolean
    processing_error?: StringNullableFilter<"WebhookEvent"> | string | null
    created_at?: DateTimeFilter<"WebhookEvent"> | Date | string
    channel?: XOR<ChannelRelationFilter, ChannelWhereInput>
  }

  export type WebhookEventOrderByWithRelationInput = {
    id?: SortOrder
    channel_id?: SortOrder
    event_type?: SortOrder
    payload?: SortOrder
    processed?: SortOrder
    processing_error?: SortOrderInput | SortOrder
    created_at?: SortOrder
    channel?: ChannelOrderByWithRelationInput
  }

  export type WebhookEventWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    AND?: WebhookEventWhereInput | WebhookEventWhereInput[]
    OR?: WebhookEventWhereInput[]
    NOT?: WebhookEventWhereInput | WebhookEventWhereInput[]
    channel_id?: UuidFilter<"WebhookEvent"> | string
    event_type?: StringFilter<"WebhookEvent"> | string
    payload?: JsonFilter<"WebhookEvent">
    processed?: BoolFilter<"WebhookEvent"> | boolean
    processing_error?: StringNullableFilter<"WebhookEvent"> | string | null
    created_at?: DateTimeFilter<"WebhookEvent"> | Date | string
    channel?: XOR<ChannelRelationFilter, ChannelWhereInput>
  }, "id">

  export type WebhookEventOrderByWithAggregationInput = {
    id?: SortOrder
    channel_id?: SortOrder
    event_type?: SortOrder
    payload?: SortOrder
    processed?: SortOrder
    processing_error?: SortOrderInput | SortOrder
    created_at?: SortOrder
    _count?: WebhookEventCountOrderByAggregateInput
    _max?: WebhookEventMaxOrderByAggregateInput
    _min?: WebhookEventMinOrderByAggregateInput
  }

  export type WebhookEventScalarWhereWithAggregatesInput = {
    AND?: WebhookEventScalarWhereWithAggregatesInput | WebhookEventScalarWhereWithAggregatesInput[]
    OR?: WebhookEventScalarWhereWithAggregatesInput[]
    NOT?: WebhookEventScalarWhereWithAggregatesInput | WebhookEventScalarWhereWithAggregatesInput[]
    id?: UuidWithAggregatesFilter<"WebhookEvent"> | string
    channel_id?: UuidWithAggregatesFilter<"WebhookEvent"> | string
    event_type?: StringWithAggregatesFilter<"WebhookEvent"> | string
    payload?: JsonWithAggregatesFilter<"WebhookEvent">
    processed?: BoolWithAggregatesFilter<"WebhookEvent"> | boolean
    processing_error?: StringNullableWithAggregatesFilter<"WebhookEvent"> | string | null
    created_at?: DateTimeWithAggregatesFilter<"WebhookEvent"> | Date | string
  }

  export type CompanyCreateInput = {
    id?: string
    name: string
    slug: string
    settings?: JsonNullValueInput | InputJsonValue
    created_at?: Date | string
    updated_at?: Date | string
    users?: UserCreateNestedManyWithoutCompanyInput
    channels?: ChannelCreateNestedManyWithoutCompanyInput
    bots?: BotCreateNestedManyWithoutCompanyInput
    contacts?: ContactCreateNestedManyWithoutCompanyInput
    conversations?: ConversationCreateNestedManyWithoutCompanyInput
    tickets?: TicketCreateNestedManyWithoutCompanyInput
  }

  export type CompanyUncheckedCreateInput = {
    id?: string
    name: string
    slug: string
    settings?: JsonNullValueInput | InputJsonValue
    created_at?: Date | string
    updated_at?: Date | string
    users?: UserUncheckedCreateNestedManyWithoutCompanyInput
    channels?: ChannelUncheckedCreateNestedManyWithoutCompanyInput
    bots?: BotUncheckedCreateNestedManyWithoutCompanyInput
    contacts?: ContactUncheckedCreateNestedManyWithoutCompanyInput
    conversations?: ConversationUncheckedCreateNestedManyWithoutCompanyInput
    tickets?: TicketUncheckedCreateNestedManyWithoutCompanyInput
  }

  export type CompanyUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    slug?: StringFieldUpdateOperationsInput | string
    settings?: JsonNullValueInput | InputJsonValue
    created_at?: DateTimeFieldUpdateOperationsInput | Date | string
    updated_at?: DateTimeFieldUpdateOperationsInput | Date | string
    users?: UserUpdateManyWithoutCompanyNestedInput
    channels?: ChannelUpdateManyWithoutCompanyNestedInput
    bots?: BotUpdateManyWithoutCompanyNestedInput
    contacts?: ContactUpdateManyWithoutCompanyNestedInput
    conversations?: ConversationUpdateManyWithoutCompanyNestedInput
    tickets?: TicketUpdateManyWithoutCompanyNestedInput
  }

  export type CompanyUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    slug?: StringFieldUpdateOperationsInput | string
    settings?: JsonNullValueInput | InputJsonValue
    created_at?: DateTimeFieldUpdateOperationsInput | Date | string
    updated_at?: DateTimeFieldUpdateOperationsInput | Date | string
    users?: UserUncheckedUpdateManyWithoutCompanyNestedInput
    channels?: ChannelUncheckedUpdateManyWithoutCompanyNestedInput
    bots?: BotUncheckedUpdateManyWithoutCompanyNestedInput
    contacts?: ContactUncheckedUpdateManyWithoutCompanyNestedInput
    conversations?: ConversationUncheckedUpdateManyWithoutCompanyNestedInput
    tickets?: TicketUncheckedUpdateManyWithoutCompanyNestedInput
  }

  export type CompanyCreateManyInput = {
    id?: string
    name: string
    slug: string
    settings?: JsonNullValueInput | InputJsonValue
    created_at?: Date | string
    updated_at?: Date | string
  }

  export type CompanyUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    slug?: StringFieldUpdateOperationsInput | string
    settings?: JsonNullValueInput | InputJsonValue
    created_at?: DateTimeFieldUpdateOperationsInput | Date | string
    updated_at?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type CompanyUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    slug?: StringFieldUpdateOperationsInput | string
    settings?: JsonNullValueInput | InputJsonValue
    created_at?: DateTimeFieldUpdateOperationsInput | Date | string
    updated_at?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type UserCreateInput = {
    id?: string
    email: string
    password_hash: string
    name: string
    role?: string
    is_active?: boolean
    created_at?: Date | string
    updated_at?: Date | string
    company: CompanyCreateNestedOneWithoutUsersInput
    assigned_conversations?: ConversationCreateNestedManyWithoutAssigned_userInput
    assigned_tickets?: TicketCreateNestedManyWithoutAssigned_userInput
  }

  export type UserUncheckedCreateInput = {
    id?: string
    email: string
    password_hash: string
    name: string
    role?: string
    company_id: string
    is_active?: boolean
    created_at?: Date | string
    updated_at?: Date | string
    assigned_conversations?: ConversationUncheckedCreateNestedManyWithoutAssigned_userInput
    assigned_tickets?: TicketUncheckedCreateNestedManyWithoutAssigned_userInput
  }

  export type UserUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    email?: StringFieldUpdateOperationsInput | string
    password_hash?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    role?: StringFieldUpdateOperationsInput | string
    is_active?: BoolFieldUpdateOperationsInput | boolean
    created_at?: DateTimeFieldUpdateOperationsInput | Date | string
    updated_at?: DateTimeFieldUpdateOperationsInput | Date | string
    company?: CompanyUpdateOneRequiredWithoutUsersNestedInput
    assigned_conversations?: ConversationUpdateManyWithoutAssigned_userNestedInput
    assigned_tickets?: TicketUpdateManyWithoutAssigned_userNestedInput
  }

  export type UserUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    email?: StringFieldUpdateOperationsInput | string
    password_hash?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    role?: StringFieldUpdateOperationsInput | string
    company_id?: StringFieldUpdateOperationsInput | string
    is_active?: BoolFieldUpdateOperationsInput | boolean
    created_at?: DateTimeFieldUpdateOperationsInput | Date | string
    updated_at?: DateTimeFieldUpdateOperationsInput | Date | string
    assigned_conversations?: ConversationUncheckedUpdateManyWithoutAssigned_userNestedInput
    assigned_tickets?: TicketUncheckedUpdateManyWithoutAssigned_userNestedInput
  }

  export type UserCreateManyInput = {
    id?: string
    email: string
    password_hash: string
    name: string
    role?: string
    company_id: string
    is_active?: boolean
    created_at?: Date | string
    updated_at?: Date | string
  }

  export type UserUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    email?: StringFieldUpdateOperationsInput | string
    password_hash?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    role?: StringFieldUpdateOperationsInput | string
    is_active?: BoolFieldUpdateOperationsInput | boolean
    created_at?: DateTimeFieldUpdateOperationsInput | Date | string
    updated_at?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type UserUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    email?: StringFieldUpdateOperationsInput | string
    password_hash?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    role?: StringFieldUpdateOperationsInput | string
    company_id?: StringFieldUpdateOperationsInput | string
    is_active?: BoolFieldUpdateOperationsInput | boolean
    created_at?: DateTimeFieldUpdateOperationsInput | Date | string
    updated_at?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type ChannelCreateInput = {
    id?: string
    name: string
    type: string
    status?: string
    phone_number?: string | null
    instance_id?: string | null
    api_key?: string | null
    webhook_url?: string | null
    settings?: JsonNullValueInput | InputJsonValue
    created_at?: Date | string
    updated_at?: Date | string
    company: CompanyCreateNestedOneWithoutChannelsInput
    conversations?: ConversationCreateNestedManyWithoutChannelInput
    channel_bots?: ChannelBotCreateNestedManyWithoutChannelInput
    webhook_events?: WebhookEventCreateNestedManyWithoutChannelInput
  }

  export type ChannelUncheckedCreateInput = {
    id?: string
    name: string
    type: string
    status?: string
    phone_number?: string | null
    instance_id?: string | null
    api_key?: string | null
    webhook_url?: string | null
    settings?: JsonNullValueInput | InputJsonValue
    company_id: string
    created_at?: Date | string
    updated_at?: Date | string
    conversations?: ConversationUncheckedCreateNestedManyWithoutChannelInput
    channel_bots?: ChannelBotUncheckedCreateNestedManyWithoutChannelInput
    webhook_events?: WebhookEventUncheckedCreateNestedManyWithoutChannelInput
  }

  export type ChannelUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    type?: StringFieldUpdateOperationsInput | string
    status?: StringFieldUpdateOperationsInput | string
    phone_number?: NullableStringFieldUpdateOperationsInput | string | null
    instance_id?: NullableStringFieldUpdateOperationsInput | string | null
    api_key?: NullableStringFieldUpdateOperationsInput | string | null
    webhook_url?: NullableStringFieldUpdateOperationsInput | string | null
    settings?: JsonNullValueInput | InputJsonValue
    created_at?: DateTimeFieldUpdateOperationsInput | Date | string
    updated_at?: DateTimeFieldUpdateOperationsInput | Date | string
    company?: CompanyUpdateOneRequiredWithoutChannelsNestedInput
    conversations?: ConversationUpdateManyWithoutChannelNestedInput
    channel_bots?: ChannelBotUpdateManyWithoutChannelNestedInput
    webhook_events?: WebhookEventUpdateManyWithoutChannelNestedInput
  }

  export type ChannelUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    type?: StringFieldUpdateOperationsInput | string
    status?: StringFieldUpdateOperationsInput | string
    phone_number?: NullableStringFieldUpdateOperationsInput | string | null
    instance_id?: NullableStringFieldUpdateOperationsInput | string | null
    api_key?: NullableStringFieldUpdateOperationsInput | string | null
    webhook_url?: NullableStringFieldUpdateOperationsInput | string | null
    settings?: JsonNullValueInput | InputJsonValue
    company_id?: StringFieldUpdateOperationsInput | string
    created_at?: DateTimeFieldUpdateOperationsInput | Date | string
    updated_at?: DateTimeFieldUpdateOperationsInput | Date | string
    conversations?: ConversationUncheckedUpdateManyWithoutChannelNestedInput
    channel_bots?: ChannelBotUncheckedUpdateManyWithoutChannelNestedInput
    webhook_events?: WebhookEventUncheckedUpdateManyWithoutChannelNestedInput
  }

  export type ChannelCreateManyInput = {
    id?: string
    name: string
    type: string
    status?: string
    phone_number?: string | null
    instance_id?: string | null
    api_key?: string | null
    webhook_url?: string | null
    settings?: JsonNullValueInput | InputJsonValue
    company_id: string
    created_at?: Date | string
    updated_at?: Date | string
  }

  export type ChannelUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    type?: StringFieldUpdateOperationsInput | string
    status?: StringFieldUpdateOperationsInput | string
    phone_number?: NullableStringFieldUpdateOperationsInput | string | null
    instance_id?: NullableStringFieldUpdateOperationsInput | string | null
    api_key?: NullableStringFieldUpdateOperationsInput | string | null
    webhook_url?: NullableStringFieldUpdateOperationsInput | string | null
    settings?: JsonNullValueInput | InputJsonValue
    created_at?: DateTimeFieldUpdateOperationsInput | Date | string
    updated_at?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type ChannelUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    type?: StringFieldUpdateOperationsInput | string
    status?: StringFieldUpdateOperationsInput | string
    phone_number?: NullableStringFieldUpdateOperationsInput | string | null
    instance_id?: NullableStringFieldUpdateOperationsInput | string | null
    api_key?: NullableStringFieldUpdateOperationsInput | string | null
    webhook_url?: NullableStringFieldUpdateOperationsInput | string | null
    settings?: JsonNullValueInput | InputJsonValue
    company_id?: StringFieldUpdateOperationsInput | string
    created_at?: DateTimeFieldUpdateOperationsInput | Date | string
    updated_at?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type BotCreateInput = {
    id?: string
    name: string
    description?: string | null
    is_active?: boolean
    flow_data?: JsonNullValueInput | InputJsonValue
    created_at?: Date | string
    updated_at?: Date | string
    company: CompanyCreateNestedOneWithoutBotsInput
    conversations?: ConversationCreateNestedManyWithoutBotInput
    channel_bots?: ChannelBotCreateNestedManyWithoutBotInput
  }

  export type BotUncheckedCreateInput = {
    id?: string
    name: string
    description?: string | null
    is_active?: boolean
    flow_data?: JsonNullValueInput | InputJsonValue
    company_id: string
    created_at?: Date | string
    updated_at?: Date | string
    conversations?: ConversationUncheckedCreateNestedManyWithoutBotInput
    channel_bots?: ChannelBotUncheckedCreateNestedManyWithoutBotInput
  }

  export type BotUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    description?: NullableStringFieldUpdateOperationsInput | string | null
    is_active?: BoolFieldUpdateOperationsInput | boolean
    flow_data?: JsonNullValueInput | InputJsonValue
    created_at?: DateTimeFieldUpdateOperationsInput | Date | string
    updated_at?: DateTimeFieldUpdateOperationsInput | Date | string
    company?: CompanyUpdateOneRequiredWithoutBotsNestedInput
    conversations?: ConversationUpdateManyWithoutBotNestedInput
    channel_bots?: ChannelBotUpdateManyWithoutBotNestedInput
  }

  export type BotUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    description?: NullableStringFieldUpdateOperationsInput | string | null
    is_active?: BoolFieldUpdateOperationsInput | boolean
    flow_data?: JsonNullValueInput | InputJsonValue
    company_id?: StringFieldUpdateOperationsInput | string
    created_at?: DateTimeFieldUpdateOperationsInput | Date | string
    updated_at?: DateTimeFieldUpdateOperationsInput | Date | string
    conversations?: ConversationUncheckedUpdateManyWithoutBotNestedInput
    channel_bots?: ChannelBotUncheckedUpdateManyWithoutBotNestedInput
  }

  export type BotCreateManyInput = {
    id?: string
    name: string
    description?: string | null
    is_active?: boolean
    flow_data?: JsonNullValueInput | InputJsonValue
    company_id: string
    created_at?: Date | string
    updated_at?: Date | string
  }

  export type BotUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    description?: NullableStringFieldUpdateOperationsInput | string | null
    is_active?: BoolFieldUpdateOperationsInput | boolean
    flow_data?: JsonNullValueInput | InputJsonValue
    created_at?: DateTimeFieldUpdateOperationsInput | Date | string
    updated_at?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type BotUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    description?: NullableStringFieldUpdateOperationsInput | string | null
    is_active?: BoolFieldUpdateOperationsInput | boolean
    flow_data?: JsonNullValueInput | InputJsonValue
    company_id?: StringFieldUpdateOperationsInput | string
    created_at?: DateTimeFieldUpdateOperationsInput | Date | string
    updated_at?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type ChannelBotCreateInput = {
    id?: string
    is_active?: boolean
    trigger_conditions?: JsonNullValueInput | InputJsonValue
    created_at?: Date | string
    channel: ChannelCreateNestedOneWithoutChannel_botsInput
    bot: BotCreateNestedOneWithoutChannel_botsInput
  }

  export type ChannelBotUncheckedCreateInput = {
    id?: string
    channel_id: string
    bot_id: string
    is_active?: boolean
    trigger_conditions?: JsonNullValueInput | InputJsonValue
    created_at?: Date | string
  }

  export type ChannelBotUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    is_active?: BoolFieldUpdateOperationsInput | boolean
    trigger_conditions?: JsonNullValueInput | InputJsonValue
    created_at?: DateTimeFieldUpdateOperationsInput | Date | string
    channel?: ChannelUpdateOneRequiredWithoutChannel_botsNestedInput
    bot?: BotUpdateOneRequiredWithoutChannel_botsNestedInput
  }

  export type ChannelBotUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    channel_id?: StringFieldUpdateOperationsInput | string
    bot_id?: StringFieldUpdateOperationsInput | string
    is_active?: BoolFieldUpdateOperationsInput | boolean
    trigger_conditions?: JsonNullValueInput | InputJsonValue
    created_at?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type ChannelBotCreateManyInput = {
    id?: string
    channel_id: string
    bot_id: string
    is_active?: boolean
    trigger_conditions?: JsonNullValueInput | InputJsonValue
    created_at?: Date | string
  }

  export type ChannelBotUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    is_active?: BoolFieldUpdateOperationsInput | boolean
    trigger_conditions?: JsonNullValueInput | InputJsonValue
    created_at?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type ChannelBotUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    channel_id?: StringFieldUpdateOperationsInput | string
    bot_id?: StringFieldUpdateOperationsInput | string
    is_active?: BoolFieldUpdateOperationsInput | boolean
    trigger_conditions?: JsonNullValueInput | InputJsonValue
    created_at?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type ContactCreateInput = {
    id?: string
    name?: string | null
    phone: string
    email?: string | null
    avatar_url?: string | null
    metadata?: JsonNullValueInput | InputJsonValue
    created_at?: Date | string
    updated_at?: Date | string
    company: CompanyCreateNestedOneWithoutContactsInput
    conversations?: ConversationCreateNestedManyWithoutContactInput
  }

  export type ContactUncheckedCreateInput = {
    id?: string
    name?: string | null
    phone: string
    email?: string | null
    avatar_url?: string | null
    metadata?: JsonNullValueInput | InputJsonValue
    company_id: string
    created_at?: Date | string
    updated_at?: Date | string
    conversations?: ConversationUncheckedCreateNestedManyWithoutContactInput
  }

  export type ContactUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: NullableStringFieldUpdateOperationsInput | string | null
    phone?: StringFieldUpdateOperationsInput | string
    email?: NullableStringFieldUpdateOperationsInput | string | null
    avatar_url?: NullableStringFieldUpdateOperationsInput | string | null
    metadata?: JsonNullValueInput | InputJsonValue
    created_at?: DateTimeFieldUpdateOperationsInput | Date | string
    updated_at?: DateTimeFieldUpdateOperationsInput | Date | string
    company?: CompanyUpdateOneRequiredWithoutContactsNestedInput
    conversations?: ConversationUpdateManyWithoutContactNestedInput
  }

  export type ContactUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: NullableStringFieldUpdateOperationsInput | string | null
    phone?: StringFieldUpdateOperationsInput | string
    email?: NullableStringFieldUpdateOperationsInput | string | null
    avatar_url?: NullableStringFieldUpdateOperationsInput | string | null
    metadata?: JsonNullValueInput | InputJsonValue
    company_id?: StringFieldUpdateOperationsInput | string
    created_at?: DateTimeFieldUpdateOperationsInput | Date | string
    updated_at?: DateTimeFieldUpdateOperationsInput | Date | string
    conversations?: ConversationUncheckedUpdateManyWithoutContactNestedInput
  }

  export type ContactCreateManyInput = {
    id?: string
    name?: string | null
    phone: string
    email?: string | null
    avatar_url?: string | null
    metadata?: JsonNullValueInput | InputJsonValue
    company_id: string
    created_at?: Date | string
    updated_at?: Date | string
  }

  export type ContactUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: NullableStringFieldUpdateOperationsInput | string | null
    phone?: StringFieldUpdateOperationsInput | string
    email?: NullableStringFieldUpdateOperationsInput | string | null
    avatar_url?: NullableStringFieldUpdateOperationsInput | string | null
    metadata?: JsonNullValueInput | InputJsonValue
    created_at?: DateTimeFieldUpdateOperationsInput | Date | string
    updated_at?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type ContactUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: NullableStringFieldUpdateOperationsInput | string | null
    phone?: StringFieldUpdateOperationsInput | string
    email?: NullableStringFieldUpdateOperationsInput | string | null
    avatar_url?: NullableStringFieldUpdateOperationsInput | string | null
    metadata?: JsonNullValueInput | InputJsonValue
    company_id?: StringFieldUpdateOperationsInput | string
    created_at?: DateTimeFieldUpdateOperationsInput | Date | string
    updated_at?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type ConversationCreateInput = {
    id?: string
    status?: string
    last_message_at?: Date | string
    metadata?: JsonNullValueInput | InputJsonValue
    created_at?: Date | string
    updated_at?: Date | string
    contact: ContactCreateNestedOneWithoutConversationsInput
    channel: ChannelCreateNestedOneWithoutConversationsInput
    bot?: BotCreateNestedOneWithoutConversationsInput
    assigned_user?: UserCreateNestedOneWithoutAssigned_conversationsInput
    company: CompanyCreateNestedOneWithoutConversationsInput
    messages?: MessageCreateNestedManyWithoutConversationInput
    tickets?: TicketCreateNestedManyWithoutConversationInput
  }

  export type ConversationUncheckedCreateInput = {
    id?: string
    contact_id: string
    channel_id: string
    bot_id?: string | null
    status?: string
    assigned_to?: string | null
    last_message_at?: Date | string
    company_id: string
    metadata?: JsonNullValueInput | InputJsonValue
    created_at?: Date | string
    updated_at?: Date | string
    messages?: MessageUncheckedCreateNestedManyWithoutConversationInput
    tickets?: TicketUncheckedCreateNestedManyWithoutConversationInput
  }

  export type ConversationUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    status?: StringFieldUpdateOperationsInput | string
    last_message_at?: DateTimeFieldUpdateOperationsInput | Date | string
    metadata?: JsonNullValueInput | InputJsonValue
    created_at?: DateTimeFieldUpdateOperationsInput | Date | string
    updated_at?: DateTimeFieldUpdateOperationsInput | Date | string
    contact?: ContactUpdateOneRequiredWithoutConversationsNestedInput
    channel?: ChannelUpdateOneRequiredWithoutConversationsNestedInput
    bot?: BotUpdateOneWithoutConversationsNestedInput
    assigned_user?: UserUpdateOneWithoutAssigned_conversationsNestedInput
    company?: CompanyUpdateOneRequiredWithoutConversationsNestedInput
    messages?: MessageUpdateManyWithoutConversationNestedInput
    tickets?: TicketUpdateManyWithoutConversationNestedInput
  }

  export type ConversationUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    contact_id?: StringFieldUpdateOperationsInput | string
    channel_id?: StringFieldUpdateOperationsInput | string
    bot_id?: NullableStringFieldUpdateOperationsInput | string | null
    status?: StringFieldUpdateOperationsInput | string
    assigned_to?: NullableStringFieldUpdateOperationsInput | string | null
    last_message_at?: DateTimeFieldUpdateOperationsInput | Date | string
    company_id?: StringFieldUpdateOperationsInput | string
    metadata?: JsonNullValueInput | InputJsonValue
    created_at?: DateTimeFieldUpdateOperationsInput | Date | string
    updated_at?: DateTimeFieldUpdateOperationsInput | Date | string
    messages?: MessageUncheckedUpdateManyWithoutConversationNestedInput
    tickets?: TicketUncheckedUpdateManyWithoutConversationNestedInput
  }

  export type ConversationCreateManyInput = {
    id?: string
    contact_id: string
    channel_id: string
    bot_id?: string | null
    status?: string
    assigned_to?: string | null
    last_message_at?: Date | string
    company_id: string
    metadata?: JsonNullValueInput | InputJsonValue
    created_at?: Date | string
    updated_at?: Date | string
  }

  export type ConversationUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    status?: StringFieldUpdateOperationsInput | string
    last_message_at?: DateTimeFieldUpdateOperationsInput | Date | string
    metadata?: JsonNullValueInput | InputJsonValue
    created_at?: DateTimeFieldUpdateOperationsInput | Date | string
    updated_at?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type ConversationUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    contact_id?: StringFieldUpdateOperationsInput | string
    channel_id?: StringFieldUpdateOperationsInput | string
    bot_id?: NullableStringFieldUpdateOperationsInput | string | null
    status?: StringFieldUpdateOperationsInput | string
    assigned_to?: NullableStringFieldUpdateOperationsInput | string | null
    last_message_at?: DateTimeFieldUpdateOperationsInput | Date | string
    company_id?: StringFieldUpdateOperationsInput | string
    metadata?: JsonNullValueInput | InputJsonValue
    created_at?: DateTimeFieldUpdateOperationsInput | Date | string
    updated_at?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type MessageCreateInput = {
    id?: string
    content: string
    message_type?: string
    sender_type: string
    sender_id?: string | null
    external_id?: string | null
    metadata?: JsonNullValueInput | InputJsonValue
    created_at?: Date | string
    conversation: ConversationCreateNestedOneWithoutMessagesInput
  }

  export type MessageUncheckedCreateInput = {
    id?: string
    conversation_id: string
    content: string
    message_type?: string
    sender_type: string
    sender_id?: string | null
    external_id?: string | null
    metadata?: JsonNullValueInput | InputJsonValue
    created_at?: Date | string
  }

  export type MessageUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    content?: StringFieldUpdateOperationsInput | string
    message_type?: StringFieldUpdateOperationsInput | string
    sender_type?: StringFieldUpdateOperationsInput | string
    sender_id?: NullableStringFieldUpdateOperationsInput | string | null
    external_id?: NullableStringFieldUpdateOperationsInput | string | null
    metadata?: JsonNullValueInput | InputJsonValue
    created_at?: DateTimeFieldUpdateOperationsInput | Date | string
    conversation?: ConversationUpdateOneRequiredWithoutMessagesNestedInput
  }

  export type MessageUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    conversation_id?: StringFieldUpdateOperationsInput | string
    content?: StringFieldUpdateOperationsInput | string
    message_type?: StringFieldUpdateOperationsInput | string
    sender_type?: StringFieldUpdateOperationsInput | string
    sender_id?: NullableStringFieldUpdateOperationsInput | string | null
    external_id?: NullableStringFieldUpdateOperationsInput | string | null
    metadata?: JsonNullValueInput | InputJsonValue
    created_at?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type MessageCreateManyInput = {
    id?: string
    conversation_id: string
    content: string
    message_type?: string
    sender_type: string
    sender_id?: string | null
    external_id?: string | null
    metadata?: JsonNullValueInput | InputJsonValue
    created_at?: Date | string
  }

  export type MessageUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    content?: StringFieldUpdateOperationsInput | string
    message_type?: StringFieldUpdateOperationsInput | string
    sender_type?: StringFieldUpdateOperationsInput | string
    sender_id?: NullableStringFieldUpdateOperationsInput | string | null
    external_id?: NullableStringFieldUpdateOperationsInput | string | null
    metadata?: JsonNullValueInput | InputJsonValue
    created_at?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type MessageUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    conversation_id?: StringFieldUpdateOperationsInput | string
    content?: StringFieldUpdateOperationsInput | string
    message_type?: StringFieldUpdateOperationsInput | string
    sender_type?: StringFieldUpdateOperationsInput | string
    sender_id?: NullableStringFieldUpdateOperationsInput | string | null
    external_id?: NullableStringFieldUpdateOperationsInput | string | null
    metadata?: JsonNullValueInput | InputJsonValue
    created_at?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type TicketCreateInput = {
    id?: string
    ticket_number: string
    title: string
    description?: string | null
    status?: string
    priority?: string
    form_data?: JsonNullValueInput | InputJsonValue
    created_at?: Date | string
    updated_at?: Date | string
    conversation: ConversationCreateNestedOneWithoutTicketsInput
    assigned_user?: UserCreateNestedOneWithoutAssigned_ticketsInput
    company: CompanyCreateNestedOneWithoutTicketsInput
  }

  export type TicketUncheckedCreateInput = {
    id?: string
    ticket_number: string
    conversation_id: string
    title: string
    description?: string | null
    status?: string
    priority?: string
    assigned_to?: string | null
    form_data?: JsonNullValueInput | InputJsonValue
    company_id: string
    created_at?: Date | string
    updated_at?: Date | string
  }

  export type TicketUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    ticket_number?: StringFieldUpdateOperationsInput | string
    title?: StringFieldUpdateOperationsInput | string
    description?: NullableStringFieldUpdateOperationsInput | string | null
    status?: StringFieldUpdateOperationsInput | string
    priority?: StringFieldUpdateOperationsInput | string
    form_data?: JsonNullValueInput | InputJsonValue
    created_at?: DateTimeFieldUpdateOperationsInput | Date | string
    updated_at?: DateTimeFieldUpdateOperationsInput | Date | string
    conversation?: ConversationUpdateOneRequiredWithoutTicketsNestedInput
    assigned_user?: UserUpdateOneWithoutAssigned_ticketsNestedInput
    company?: CompanyUpdateOneRequiredWithoutTicketsNestedInput
  }

  export type TicketUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    ticket_number?: StringFieldUpdateOperationsInput | string
    conversation_id?: StringFieldUpdateOperationsInput | string
    title?: StringFieldUpdateOperationsInput | string
    description?: NullableStringFieldUpdateOperationsInput | string | null
    status?: StringFieldUpdateOperationsInput | string
    priority?: StringFieldUpdateOperationsInput | string
    assigned_to?: NullableStringFieldUpdateOperationsInput | string | null
    form_data?: JsonNullValueInput | InputJsonValue
    company_id?: StringFieldUpdateOperationsInput | string
    created_at?: DateTimeFieldUpdateOperationsInput | Date | string
    updated_at?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type TicketCreateManyInput = {
    id?: string
    ticket_number: string
    conversation_id: string
    title: string
    description?: string | null
    status?: string
    priority?: string
    assigned_to?: string | null
    form_data?: JsonNullValueInput | InputJsonValue
    company_id: string
    created_at?: Date | string
    updated_at?: Date | string
  }

  export type TicketUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    ticket_number?: StringFieldUpdateOperationsInput | string
    title?: StringFieldUpdateOperationsInput | string
    description?: NullableStringFieldUpdateOperationsInput | string | null
    status?: StringFieldUpdateOperationsInput | string
    priority?: StringFieldUpdateOperationsInput | string
    form_data?: JsonNullValueInput | InputJsonValue
    created_at?: DateTimeFieldUpdateOperationsInput | Date | string
    updated_at?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type TicketUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    ticket_number?: StringFieldUpdateOperationsInput | string
    conversation_id?: StringFieldUpdateOperationsInput | string
    title?: StringFieldUpdateOperationsInput | string
    description?: NullableStringFieldUpdateOperationsInput | string | null
    status?: StringFieldUpdateOperationsInput | string
    priority?: StringFieldUpdateOperationsInput | string
    assigned_to?: NullableStringFieldUpdateOperationsInput | string | null
    form_data?: JsonNullValueInput | InputJsonValue
    company_id?: StringFieldUpdateOperationsInput | string
    created_at?: DateTimeFieldUpdateOperationsInput | Date | string
    updated_at?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type WebhookEventCreateInput = {
    id?: string
    event_type: string
    payload?: JsonNullValueInput | InputJsonValue
    processed?: boolean
    processing_error?: string | null
    created_at?: Date | string
    channel: ChannelCreateNestedOneWithoutWebhook_eventsInput
  }

  export type WebhookEventUncheckedCreateInput = {
    id?: string
    channel_id: string
    event_type: string
    payload?: JsonNullValueInput | InputJsonValue
    processed?: boolean
    processing_error?: string | null
    created_at?: Date | string
  }

  export type WebhookEventUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    event_type?: StringFieldUpdateOperationsInput | string
    payload?: JsonNullValueInput | InputJsonValue
    processed?: BoolFieldUpdateOperationsInput | boolean
    processing_error?: NullableStringFieldUpdateOperationsInput | string | null
    created_at?: DateTimeFieldUpdateOperationsInput | Date | string
    channel?: ChannelUpdateOneRequiredWithoutWebhook_eventsNestedInput
  }

  export type WebhookEventUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    channel_id?: StringFieldUpdateOperationsInput | string
    event_type?: StringFieldUpdateOperationsInput | string
    payload?: JsonNullValueInput | InputJsonValue
    processed?: BoolFieldUpdateOperationsInput | boolean
    processing_error?: NullableStringFieldUpdateOperationsInput | string | null
    created_at?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type WebhookEventCreateManyInput = {
    id?: string
    channel_id: string
    event_type: string
    payload?: JsonNullValueInput | InputJsonValue
    processed?: boolean
    processing_error?: string | null
    created_at?: Date | string
  }

  export type WebhookEventUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    event_type?: StringFieldUpdateOperationsInput | string
    payload?: JsonNullValueInput | InputJsonValue
    processed?: BoolFieldUpdateOperationsInput | boolean
    processing_error?: NullableStringFieldUpdateOperationsInput | string | null
    created_at?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type WebhookEventUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    channel_id?: StringFieldUpdateOperationsInput | string
    event_type?: StringFieldUpdateOperationsInput | string
    payload?: JsonNullValueInput | InputJsonValue
    processed?: BoolFieldUpdateOperationsInput | boolean
    processing_error?: NullableStringFieldUpdateOperationsInput | string | null
    created_at?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type UuidFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel>
    in?: string[] | ListStringFieldRefInput<$PrismaModel>
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel>
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    mode?: QueryMode
    not?: NestedUuidFilter<$PrismaModel> | string
  }

  export type StringFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel>
    in?: string[] | ListStringFieldRefInput<$PrismaModel>
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel>
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    mode?: QueryMode
    not?: NestedStringFilter<$PrismaModel> | string
  }
  export type JsonFilter<$PrismaModel = never> = 
    | PatchUndefined<
        Either<Required<JsonFilterBase<$PrismaModel>>, Exclude<keyof Required<JsonFilterBase<$PrismaModel>>, 'path'>>,
        Required<JsonFilterBase<$PrismaModel>>
      >
    | OptionalFlat<Omit<Required<JsonFilterBase<$PrismaModel>>, 'path'>>

  export type JsonFilterBase<$PrismaModel = never> = {
    equals?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | JsonNullValueFilter
    path?: string[]
    string_contains?: string | StringFieldRefInput<$PrismaModel>
    string_starts_with?: string | StringFieldRefInput<$PrismaModel>
    string_ends_with?: string | StringFieldRefInput<$PrismaModel>
    array_contains?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    array_starts_with?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    array_ends_with?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    lt?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    lte?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    gt?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    gte?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    not?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | JsonNullValueFilter
  }

  export type DateTimeFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    in?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    notIn?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeFilter<$PrismaModel> | Date | string
  }

  export type UserListRelationFilter = {
    every?: UserWhereInput
    some?: UserWhereInput
    none?: UserWhereInput
  }

  export type ChannelListRelationFilter = {
    every?: ChannelWhereInput
    some?: ChannelWhereInput
    none?: ChannelWhereInput
  }

  export type BotListRelationFilter = {
    every?: BotWhereInput
    some?: BotWhereInput
    none?: BotWhereInput
  }

  export type ContactListRelationFilter = {
    every?: ContactWhereInput
    some?: ContactWhereInput
    none?: ContactWhereInput
  }

  export type ConversationListRelationFilter = {
    every?: ConversationWhereInput
    some?: ConversationWhereInput
    none?: ConversationWhereInput
  }

  export type TicketListRelationFilter = {
    every?: TicketWhereInput
    some?: TicketWhereInput
    none?: TicketWhereInput
  }

  export type UserOrderByRelationAggregateInput = {
    _count?: SortOrder
  }

  export type ChannelOrderByRelationAggregateInput = {
    _count?: SortOrder
  }

  export type BotOrderByRelationAggregateInput = {
    _count?: SortOrder
  }

  export type ContactOrderByRelationAggregateInput = {
    _count?: SortOrder
  }

  export type ConversationOrderByRelationAggregateInput = {
    _count?: SortOrder
  }

  export type TicketOrderByRelationAggregateInput = {
    _count?: SortOrder
  }

  export type CompanyCountOrderByAggregateInput = {
    id?: SortOrder
    name?: SortOrder
    slug?: SortOrder
    settings?: SortOrder
    created_at?: SortOrder
    updated_at?: SortOrder
  }

  export type CompanyMaxOrderByAggregateInput = {
    id?: SortOrder
    name?: SortOrder
    slug?: SortOrder
    created_at?: SortOrder
    updated_at?: SortOrder
  }

  export type CompanyMinOrderByAggregateInput = {
    id?: SortOrder
    name?: SortOrder
    slug?: SortOrder
    created_at?: SortOrder
    updated_at?: SortOrder
  }

  export type UuidWithAggregatesFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel>
    in?: string[] | ListStringFieldRefInput<$PrismaModel>
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel>
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    mode?: QueryMode
    not?: NestedUuidWithAggregatesFilter<$PrismaModel> | string
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedStringFilter<$PrismaModel>
    _max?: NestedStringFilter<$PrismaModel>
  }

  export type StringWithAggregatesFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel>
    in?: string[] | ListStringFieldRefInput<$PrismaModel>
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel>
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    mode?: QueryMode
    not?: NestedStringWithAggregatesFilter<$PrismaModel> | string
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedStringFilter<$PrismaModel>
    _max?: NestedStringFilter<$PrismaModel>
  }
  export type JsonWithAggregatesFilter<$PrismaModel = never> = 
    | PatchUndefined<
        Either<Required<JsonWithAggregatesFilterBase<$PrismaModel>>, Exclude<keyof Required<JsonWithAggregatesFilterBase<$PrismaModel>>, 'path'>>,
        Required<JsonWithAggregatesFilterBase<$PrismaModel>>
      >
    | OptionalFlat<Omit<Required<JsonWithAggregatesFilterBase<$PrismaModel>>, 'path'>>

  export type JsonWithAggregatesFilterBase<$PrismaModel = never> = {
    equals?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | JsonNullValueFilter
    path?: string[]
    string_contains?: string | StringFieldRefInput<$PrismaModel>
    string_starts_with?: string | StringFieldRefInput<$PrismaModel>
    string_ends_with?: string | StringFieldRefInput<$PrismaModel>
    array_contains?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    array_starts_with?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    array_ends_with?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    lt?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    lte?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    gt?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    gte?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    not?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | JsonNullValueFilter
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedJsonFilter<$PrismaModel>
    _max?: NestedJsonFilter<$PrismaModel>
  }

  export type DateTimeWithAggregatesFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    in?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    notIn?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeWithAggregatesFilter<$PrismaModel> | Date | string
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedDateTimeFilter<$PrismaModel>
    _max?: NestedDateTimeFilter<$PrismaModel>
  }

  export type BoolFilter<$PrismaModel = never> = {
    equals?: boolean | BooleanFieldRefInput<$PrismaModel>
    not?: NestedBoolFilter<$PrismaModel> | boolean
  }

  export type CompanyRelationFilter = {
    is?: CompanyWhereInput
    isNot?: CompanyWhereInput
  }

  export type UserCountOrderByAggregateInput = {
    id?: SortOrder
    email?: SortOrder
    password_hash?: SortOrder
    name?: SortOrder
    role?: SortOrder
    company_id?: SortOrder
    is_active?: SortOrder
    created_at?: SortOrder
    updated_at?: SortOrder
  }

  export type UserMaxOrderByAggregateInput = {
    id?: SortOrder
    email?: SortOrder
    password_hash?: SortOrder
    name?: SortOrder
    role?: SortOrder
    company_id?: SortOrder
    is_active?: SortOrder
    created_at?: SortOrder
    updated_at?: SortOrder
  }

  export type UserMinOrderByAggregateInput = {
    id?: SortOrder
    email?: SortOrder
    password_hash?: SortOrder
    name?: SortOrder
    role?: SortOrder
    company_id?: SortOrder
    is_active?: SortOrder
    created_at?: SortOrder
    updated_at?: SortOrder
  }

  export type BoolWithAggregatesFilter<$PrismaModel = never> = {
    equals?: boolean | BooleanFieldRefInput<$PrismaModel>
    not?: NestedBoolWithAggregatesFilter<$PrismaModel> | boolean
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedBoolFilter<$PrismaModel>
    _max?: NestedBoolFilter<$PrismaModel>
  }

  export type StringNullableFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel> | null
    in?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    mode?: QueryMode
    not?: NestedStringNullableFilter<$PrismaModel> | string | null
  }

  export type ChannelBotListRelationFilter = {
    every?: ChannelBotWhereInput
    some?: ChannelBotWhereInput
    none?: ChannelBotWhereInput
  }

  export type WebhookEventListRelationFilter = {
    every?: WebhookEventWhereInput
    some?: WebhookEventWhereInput
    none?: WebhookEventWhereInput
  }

  export type SortOrderInput = {
    sort: SortOrder
    nulls?: NullsOrder
  }

  export type ChannelBotOrderByRelationAggregateInput = {
    _count?: SortOrder
  }

  export type WebhookEventOrderByRelationAggregateInput = {
    _count?: SortOrder
  }

  export type ChannelName_company_idCompoundUniqueInput = {
    name: string
    company_id: string
  }

  export type ChannelCountOrderByAggregateInput = {
    id?: SortOrder
    name?: SortOrder
    type?: SortOrder
    status?: SortOrder
    phone_number?: SortOrder
    instance_id?: SortOrder
    api_key?: SortOrder
    webhook_url?: SortOrder
    settings?: SortOrder
    company_id?: SortOrder
    created_at?: SortOrder
    updated_at?: SortOrder
  }

  export type ChannelMaxOrderByAggregateInput = {
    id?: SortOrder
    name?: SortOrder
    type?: SortOrder
    status?: SortOrder
    phone_number?: SortOrder
    instance_id?: SortOrder
    api_key?: SortOrder
    webhook_url?: SortOrder
    company_id?: SortOrder
    created_at?: SortOrder
    updated_at?: SortOrder
  }

  export type ChannelMinOrderByAggregateInput = {
    id?: SortOrder
    name?: SortOrder
    type?: SortOrder
    status?: SortOrder
    phone_number?: SortOrder
    instance_id?: SortOrder
    api_key?: SortOrder
    webhook_url?: SortOrder
    company_id?: SortOrder
    created_at?: SortOrder
    updated_at?: SortOrder
  }

  export type StringNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel> | null
    in?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    mode?: QueryMode
    not?: NestedStringNullableWithAggregatesFilter<$PrismaModel> | string | null
    _count?: NestedIntNullableFilter<$PrismaModel>
    _min?: NestedStringNullableFilter<$PrismaModel>
    _max?: NestedStringNullableFilter<$PrismaModel>
  }

  export type BotCountOrderByAggregateInput = {
    id?: SortOrder
    name?: SortOrder
    description?: SortOrder
    is_active?: SortOrder
    flow_data?: SortOrder
    company_id?: SortOrder
    created_at?: SortOrder
    updated_at?: SortOrder
  }

  export type BotMaxOrderByAggregateInput = {
    id?: SortOrder
    name?: SortOrder
    description?: SortOrder
    is_active?: SortOrder
    company_id?: SortOrder
    created_at?: SortOrder
    updated_at?: SortOrder
  }

  export type BotMinOrderByAggregateInput = {
    id?: SortOrder
    name?: SortOrder
    description?: SortOrder
    is_active?: SortOrder
    company_id?: SortOrder
    created_at?: SortOrder
    updated_at?: SortOrder
  }

  export type ChannelRelationFilter = {
    is?: ChannelWhereInput
    isNot?: ChannelWhereInput
  }

  export type BotRelationFilter = {
    is?: BotWhereInput
    isNot?: BotWhereInput
  }

  export type ChannelBotChannel_idBot_idCompoundUniqueInput = {
    channel_id: string
    bot_id: string
  }

  export type ChannelBotCountOrderByAggregateInput = {
    id?: SortOrder
    channel_id?: SortOrder
    bot_id?: SortOrder
    is_active?: SortOrder
    trigger_conditions?: SortOrder
    created_at?: SortOrder
  }

  export type ChannelBotMaxOrderByAggregateInput = {
    id?: SortOrder
    channel_id?: SortOrder
    bot_id?: SortOrder
    is_active?: SortOrder
    created_at?: SortOrder
  }

  export type ChannelBotMinOrderByAggregateInput = {
    id?: SortOrder
    channel_id?: SortOrder
    bot_id?: SortOrder
    is_active?: SortOrder
    created_at?: SortOrder
  }

  export type ContactPhoneCompany_idCompoundUniqueInput = {
    phone: string
    company_id: string
  }

  export type ContactCountOrderByAggregateInput = {
    id?: SortOrder
    name?: SortOrder
    phone?: SortOrder
    email?: SortOrder
    avatar_url?: SortOrder
    metadata?: SortOrder
    company_id?: SortOrder
    created_at?: SortOrder
    updated_at?: SortOrder
  }

  export type ContactMaxOrderByAggregateInput = {
    id?: SortOrder
    name?: SortOrder
    phone?: SortOrder
    email?: SortOrder
    avatar_url?: SortOrder
    company_id?: SortOrder
    created_at?: SortOrder
    updated_at?: SortOrder
  }

  export type ContactMinOrderByAggregateInput = {
    id?: SortOrder
    name?: SortOrder
    phone?: SortOrder
    email?: SortOrder
    avatar_url?: SortOrder
    company_id?: SortOrder
    created_at?: SortOrder
    updated_at?: SortOrder
  }

  export type UuidNullableFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel> | null
    in?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    mode?: QueryMode
    not?: NestedUuidNullableFilter<$PrismaModel> | string | null
  }

  export type ContactRelationFilter = {
    is?: ContactWhereInput
    isNot?: ContactWhereInput
  }

  export type BotNullableRelationFilter = {
    is?: BotWhereInput | null
    isNot?: BotWhereInput | null
  }

  export type UserNullableRelationFilter = {
    is?: UserWhereInput | null
    isNot?: UserWhereInput | null
  }

  export type MessageListRelationFilter = {
    every?: MessageWhereInput
    some?: MessageWhereInput
    none?: MessageWhereInput
  }

  export type MessageOrderByRelationAggregateInput = {
    _count?: SortOrder
  }

  export type ConversationCountOrderByAggregateInput = {
    id?: SortOrder
    contact_id?: SortOrder
    channel_id?: SortOrder
    bot_id?: SortOrder
    status?: SortOrder
    assigned_to?: SortOrder
    last_message_at?: SortOrder
    company_id?: SortOrder
    metadata?: SortOrder
    created_at?: SortOrder
    updated_at?: SortOrder
  }

  export type ConversationMaxOrderByAggregateInput = {
    id?: SortOrder
    contact_id?: SortOrder
    channel_id?: SortOrder
    bot_id?: SortOrder
    status?: SortOrder
    assigned_to?: SortOrder
    last_message_at?: SortOrder
    company_id?: SortOrder
    created_at?: SortOrder
    updated_at?: SortOrder
  }

  export type ConversationMinOrderByAggregateInput = {
    id?: SortOrder
    contact_id?: SortOrder
    channel_id?: SortOrder
    bot_id?: SortOrder
    status?: SortOrder
    assigned_to?: SortOrder
    last_message_at?: SortOrder
    company_id?: SortOrder
    created_at?: SortOrder
    updated_at?: SortOrder
  }

  export type UuidNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel> | null
    in?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    mode?: QueryMode
    not?: NestedUuidNullableWithAggregatesFilter<$PrismaModel> | string | null
    _count?: NestedIntNullableFilter<$PrismaModel>
    _min?: NestedStringNullableFilter<$PrismaModel>
    _max?: NestedStringNullableFilter<$PrismaModel>
  }

  export type ConversationRelationFilter = {
    is?: ConversationWhereInput
    isNot?: ConversationWhereInput
  }

  export type MessageCountOrderByAggregateInput = {
    id?: SortOrder
    conversation_id?: SortOrder
    content?: SortOrder
    message_type?: SortOrder
    sender_type?: SortOrder
    sender_id?: SortOrder
    external_id?: SortOrder
    metadata?: SortOrder
    created_at?: SortOrder
  }

  export type MessageMaxOrderByAggregateInput = {
    id?: SortOrder
    conversation_id?: SortOrder
    content?: SortOrder
    message_type?: SortOrder
    sender_type?: SortOrder
    sender_id?: SortOrder
    external_id?: SortOrder
    created_at?: SortOrder
  }

  export type MessageMinOrderByAggregateInput = {
    id?: SortOrder
    conversation_id?: SortOrder
    content?: SortOrder
    message_type?: SortOrder
    sender_type?: SortOrder
    sender_id?: SortOrder
    external_id?: SortOrder
    created_at?: SortOrder
  }

  export type TicketCountOrderByAggregateInput = {
    id?: SortOrder
    ticket_number?: SortOrder
    conversation_id?: SortOrder
    title?: SortOrder
    description?: SortOrder
    status?: SortOrder
    priority?: SortOrder
    assigned_to?: SortOrder
    form_data?: SortOrder
    company_id?: SortOrder
    created_at?: SortOrder
    updated_at?: SortOrder
  }

  export type TicketMaxOrderByAggregateInput = {
    id?: SortOrder
    ticket_number?: SortOrder
    conversation_id?: SortOrder
    title?: SortOrder
    description?: SortOrder
    status?: SortOrder
    priority?: SortOrder
    assigned_to?: SortOrder
    company_id?: SortOrder
    created_at?: SortOrder
    updated_at?: SortOrder
  }

  export type TicketMinOrderByAggregateInput = {
    id?: SortOrder
    ticket_number?: SortOrder
    conversation_id?: SortOrder
    title?: SortOrder
    description?: SortOrder
    status?: SortOrder
    priority?: SortOrder
    assigned_to?: SortOrder
    company_id?: SortOrder
    created_at?: SortOrder
    updated_at?: SortOrder
  }

  export type WebhookEventCountOrderByAggregateInput = {
    id?: SortOrder
    channel_id?: SortOrder
    event_type?: SortOrder
    payload?: SortOrder
    processed?: SortOrder
    processing_error?: SortOrder
    created_at?: SortOrder
  }

  export type WebhookEventMaxOrderByAggregateInput = {
    id?: SortOrder
    channel_id?: SortOrder
    event_type?: SortOrder
    processed?: SortOrder
    processing_error?: SortOrder
    created_at?: SortOrder
  }

  export type WebhookEventMinOrderByAggregateInput = {
    id?: SortOrder
    channel_id?: SortOrder
    event_type?: SortOrder
    processed?: SortOrder
    processing_error?: SortOrder
    created_at?: SortOrder
  }

  export type UserCreateNestedManyWithoutCompanyInput = {
    create?: XOR<UserCreateWithoutCompanyInput, UserUncheckedCreateWithoutCompanyInput> | UserCreateWithoutCompanyInput[] | UserUncheckedCreateWithoutCompanyInput[]
    connectOrCreate?: UserCreateOrConnectWithoutCompanyInput | UserCreateOrConnectWithoutCompanyInput[]
    createMany?: UserCreateManyCompanyInputEnvelope
    connect?: UserWhereUniqueInput | UserWhereUniqueInput[]
  }

  export type ChannelCreateNestedManyWithoutCompanyInput = {
    create?: XOR<ChannelCreateWithoutCompanyInput, ChannelUncheckedCreateWithoutCompanyInput> | ChannelCreateWithoutCompanyInput[] | ChannelUncheckedCreateWithoutCompanyInput[]
    connectOrCreate?: ChannelCreateOrConnectWithoutCompanyInput | ChannelCreateOrConnectWithoutCompanyInput[]
    createMany?: ChannelCreateManyCompanyInputEnvelope
    connect?: ChannelWhereUniqueInput | ChannelWhereUniqueInput[]
  }

  export type BotCreateNestedManyWithoutCompanyInput = {
    create?: XOR<BotCreateWithoutCompanyInput, BotUncheckedCreateWithoutCompanyInput> | BotCreateWithoutCompanyInput[] | BotUncheckedCreateWithoutCompanyInput[]
    connectOrCreate?: BotCreateOrConnectWithoutCompanyInput | BotCreateOrConnectWithoutCompanyInput[]
    createMany?: BotCreateManyCompanyInputEnvelope
    connect?: BotWhereUniqueInput | BotWhereUniqueInput[]
  }

  export type ContactCreateNestedManyWithoutCompanyInput = {
    create?: XOR<ContactCreateWithoutCompanyInput, ContactUncheckedCreateWithoutCompanyInput> | ContactCreateWithoutCompanyInput[] | ContactUncheckedCreateWithoutCompanyInput[]
    connectOrCreate?: ContactCreateOrConnectWithoutCompanyInput | ContactCreateOrConnectWithoutCompanyInput[]
    createMany?: ContactCreateManyCompanyInputEnvelope
    connect?: ContactWhereUniqueInput | ContactWhereUniqueInput[]
  }

  export type ConversationCreateNestedManyWithoutCompanyInput = {
    create?: XOR<ConversationCreateWithoutCompanyInput, ConversationUncheckedCreateWithoutCompanyInput> | ConversationCreateWithoutCompanyInput[] | ConversationUncheckedCreateWithoutCompanyInput[]
    connectOrCreate?: ConversationCreateOrConnectWithoutCompanyInput | ConversationCreateOrConnectWithoutCompanyInput[]
    createMany?: ConversationCreateManyCompanyInputEnvelope
    connect?: ConversationWhereUniqueInput | ConversationWhereUniqueInput[]
  }

  export type TicketCreateNestedManyWithoutCompanyInput = {
    create?: XOR<TicketCreateWithoutCompanyInput, TicketUncheckedCreateWithoutCompanyInput> | TicketCreateWithoutCompanyInput[] | TicketUncheckedCreateWithoutCompanyInput[]
    connectOrCreate?: TicketCreateOrConnectWithoutCompanyInput | TicketCreateOrConnectWithoutCompanyInput[]
    createMany?: TicketCreateManyCompanyInputEnvelope
    connect?: TicketWhereUniqueInput | TicketWhereUniqueInput[]
  }

  export type UserUncheckedCreateNestedManyWithoutCompanyInput = {
    create?: XOR<UserCreateWithoutCompanyInput, UserUncheckedCreateWithoutCompanyInput> | UserCreateWithoutCompanyInput[] | UserUncheckedCreateWithoutCompanyInput[]
    connectOrCreate?: UserCreateOrConnectWithoutCompanyInput | UserCreateOrConnectWithoutCompanyInput[]
    createMany?: UserCreateManyCompanyInputEnvelope
    connect?: UserWhereUniqueInput | UserWhereUniqueInput[]
  }

  export type ChannelUncheckedCreateNestedManyWithoutCompanyInput = {
    create?: XOR<ChannelCreateWithoutCompanyInput, ChannelUncheckedCreateWithoutCompanyInput> | ChannelCreateWithoutCompanyInput[] | ChannelUncheckedCreateWithoutCompanyInput[]
    connectOrCreate?: ChannelCreateOrConnectWithoutCompanyInput | ChannelCreateOrConnectWithoutCompanyInput[]
    createMany?: ChannelCreateManyCompanyInputEnvelope
    connect?: ChannelWhereUniqueInput | ChannelWhereUniqueInput[]
  }

  export type BotUncheckedCreateNestedManyWithoutCompanyInput = {
    create?: XOR<BotCreateWithoutCompanyInput, BotUncheckedCreateWithoutCompanyInput> | BotCreateWithoutCompanyInput[] | BotUncheckedCreateWithoutCompanyInput[]
    connectOrCreate?: BotCreateOrConnectWithoutCompanyInput | BotCreateOrConnectWithoutCompanyInput[]
    createMany?: BotCreateManyCompanyInputEnvelope
    connect?: BotWhereUniqueInput | BotWhereUniqueInput[]
  }

  export type ContactUncheckedCreateNestedManyWithoutCompanyInput = {
    create?: XOR<ContactCreateWithoutCompanyInput, ContactUncheckedCreateWithoutCompanyInput> | ContactCreateWithoutCompanyInput[] | ContactUncheckedCreateWithoutCompanyInput[]
    connectOrCreate?: ContactCreateOrConnectWithoutCompanyInput | ContactCreateOrConnectWithoutCompanyInput[]
    createMany?: ContactCreateManyCompanyInputEnvelope
    connect?: ContactWhereUniqueInput | ContactWhereUniqueInput[]
  }

  export type ConversationUncheckedCreateNestedManyWithoutCompanyInput = {
    create?: XOR<ConversationCreateWithoutCompanyInput, ConversationUncheckedCreateWithoutCompanyInput> | ConversationCreateWithoutCompanyInput[] | ConversationUncheckedCreateWithoutCompanyInput[]
    connectOrCreate?: ConversationCreateOrConnectWithoutCompanyInput | ConversationCreateOrConnectWithoutCompanyInput[]
    createMany?: ConversationCreateManyCompanyInputEnvelope
    connect?: ConversationWhereUniqueInput | ConversationWhereUniqueInput[]
  }

  export type TicketUncheckedCreateNestedManyWithoutCompanyInput = {
    create?: XOR<TicketCreateWithoutCompanyInput, TicketUncheckedCreateWithoutCompanyInput> | TicketCreateWithoutCompanyInput[] | TicketUncheckedCreateWithoutCompanyInput[]
    connectOrCreate?: TicketCreateOrConnectWithoutCompanyInput | TicketCreateOrConnectWithoutCompanyInput[]
    createMany?: TicketCreateManyCompanyInputEnvelope
    connect?: TicketWhereUniqueInput | TicketWhereUniqueInput[]
  }

  export type StringFieldUpdateOperationsInput = {
    set?: string
  }

  export type DateTimeFieldUpdateOperationsInput = {
    set?: Date | string
  }

  export type UserUpdateManyWithoutCompanyNestedInput = {
    create?: XOR<UserCreateWithoutCompanyInput, UserUncheckedCreateWithoutCompanyInput> | UserCreateWithoutCompanyInput[] | UserUncheckedCreateWithoutCompanyInput[]
    connectOrCreate?: UserCreateOrConnectWithoutCompanyInput | UserCreateOrConnectWithoutCompanyInput[]
    upsert?: UserUpsertWithWhereUniqueWithoutCompanyInput | UserUpsertWithWhereUniqueWithoutCompanyInput[]
    createMany?: UserCreateManyCompanyInputEnvelope
    set?: UserWhereUniqueInput | UserWhereUniqueInput[]
    disconnect?: UserWhereUniqueInput | UserWhereUniqueInput[]
    delete?: UserWhereUniqueInput | UserWhereUniqueInput[]
    connect?: UserWhereUniqueInput | UserWhereUniqueInput[]
    update?: UserUpdateWithWhereUniqueWithoutCompanyInput | UserUpdateWithWhereUniqueWithoutCompanyInput[]
    updateMany?: UserUpdateManyWithWhereWithoutCompanyInput | UserUpdateManyWithWhereWithoutCompanyInput[]
    deleteMany?: UserScalarWhereInput | UserScalarWhereInput[]
  }

  export type ChannelUpdateManyWithoutCompanyNestedInput = {
    create?: XOR<ChannelCreateWithoutCompanyInput, ChannelUncheckedCreateWithoutCompanyInput> | ChannelCreateWithoutCompanyInput[] | ChannelUncheckedCreateWithoutCompanyInput[]
    connectOrCreate?: ChannelCreateOrConnectWithoutCompanyInput | ChannelCreateOrConnectWithoutCompanyInput[]
    upsert?: ChannelUpsertWithWhereUniqueWithoutCompanyInput | ChannelUpsertWithWhereUniqueWithoutCompanyInput[]
    createMany?: ChannelCreateManyCompanyInputEnvelope
    set?: ChannelWhereUniqueInput | ChannelWhereUniqueInput[]
    disconnect?: ChannelWhereUniqueInput | ChannelWhereUniqueInput[]
    delete?: ChannelWhereUniqueInput | ChannelWhereUniqueInput[]
    connect?: ChannelWhereUniqueInput | ChannelWhereUniqueInput[]
    update?: ChannelUpdateWithWhereUniqueWithoutCompanyInput | ChannelUpdateWithWhereUniqueWithoutCompanyInput[]
    updateMany?: ChannelUpdateManyWithWhereWithoutCompanyInput | ChannelUpdateManyWithWhereWithoutCompanyInput[]
    deleteMany?: ChannelScalarWhereInput | ChannelScalarWhereInput[]
  }

  export type BotUpdateManyWithoutCompanyNestedInput = {
    create?: XOR<BotCreateWithoutCompanyInput, BotUncheckedCreateWithoutCompanyInput> | BotCreateWithoutCompanyInput[] | BotUncheckedCreateWithoutCompanyInput[]
    connectOrCreate?: BotCreateOrConnectWithoutCompanyInput | BotCreateOrConnectWithoutCompanyInput[]
    upsert?: BotUpsertWithWhereUniqueWithoutCompanyInput | BotUpsertWithWhereUniqueWithoutCompanyInput[]
    createMany?: BotCreateManyCompanyInputEnvelope
    set?: BotWhereUniqueInput | BotWhereUniqueInput[]
    disconnect?: BotWhereUniqueInput | BotWhereUniqueInput[]
    delete?: BotWhereUniqueInput | BotWhereUniqueInput[]
    connect?: BotWhereUniqueInput | BotWhereUniqueInput[]
    update?: BotUpdateWithWhereUniqueWithoutCompanyInput | BotUpdateWithWhereUniqueWithoutCompanyInput[]
    updateMany?: BotUpdateManyWithWhereWithoutCompanyInput | BotUpdateManyWithWhereWithoutCompanyInput[]
    deleteMany?: BotScalarWhereInput | BotScalarWhereInput[]
  }

  export type ContactUpdateManyWithoutCompanyNestedInput = {
    create?: XOR<ContactCreateWithoutCompanyInput, ContactUncheckedCreateWithoutCompanyInput> | ContactCreateWithoutCompanyInput[] | ContactUncheckedCreateWithoutCompanyInput[]
    connectOrCreate?: ContactCreateOrConnectWithoutCompanyInput | ContactCreateOrConnectWithoutCompanyInput[]
    upsert?: ContactUpsertWithWhereUniqueWithoutCompanyInput | ContactUpsertWithWhereUniqueWithoutCompanyInput[]
    createMany?: ContactCreateManyCompanyInputEnvelope
    set?: ContactWhereUniqueInput | ContactWhereUniqueInput[]
    disconnect?: ContactWhereUniqueInput | ContactWhereUniqueInput[]
    delete?: ContactWhereUniqueInput | ContactWhereUniqueInput[]
    connect?: ContactWhereUniqueInput | ContactWhereUniqueInput[]
    update?: ContactUpdateWithWhereUniqueWithoutCompanyInput | ContactUpdateWithWhereUniqueWithoutCompanyInput[]
    updateMany?: ContactUpdateManyWithWhereWithoutCompanyInput | ContactUpdateManyWithWhereWithoutCompanyInput[]
    deleteMany?: ContactScalarWhereInput | ContactScalarWhereInput[]
  }

  export type ConversationUpdateManyWithoutCompanyNestedInput = {
    create?: XOR<ConversationCreateWithoutCompanyInput, ConversationUncheckedCreateWithoutCompanyInput> | ConversationCreateWithoutCompanyInput[] | ConversationUncheckedCreateWithoutCompanyInput[]
    connectOrCreate?: ConversationCreateOrConnectWithoutCompanyInput | ConversationCreateOrConnectWithoutCompanyInput[]
    upsert?: ConversationUpsertWithWhereUniqueWithoutCompanyInput | ConversationUpsertWithWhereUniqueWithoutCompanyInput[]
    createMany?: ConversationCreateManyCompanyInputEnvelope
    set?: ConversationWhereUniqueInput | ConversationWhereUniqueInput[]
    disconnect?: ConversationWhereUniqueInput | ConversationWhereUniqueInput[]
    delete?: ConversationWhereUniqueInput | ConversationWhereUniqueInput[]
    connect?: ConversationWhereUniqueInput | ConversationWhereUniqueInput[]
    update?: ConversationUpdateWithWhereUniqueWithoutCompanyInput | ConversationUpdateWithWhereUniqueWithoutCompanyInput[]
    updateMany?: ConversationUpdateManyWithWhereWithoutCompanyInput | ConversationUpdateManyWithWhereWithoutCompanyInput[]
    deleteMany?: ConversationScalarWhereInput | ConversationScalarWhereInput[]
  }

  export type TicketUpdateManyWithoutCompanyNestedInput = {
    create?: XOR<TicketCreateWithoutCompanyInput, TicketUncheckedCreateWithoutCompanyInput> | TicketCreateWithoutCompanyInput[] | TicketUncheckedCreateWithoutCompanyInput[]
    connectOrCreate?: TicketCreateOrConnectWithoutCompanyInput | TicketCreateOrConnectWithoutCompanyInput[]
    upsert?: TicketUpsertWithWhereUniqueWithoutCompanyInput | TicketUpsertWithWhereUniqueWithoutCompanyInput[]
    createMany?: TicketCreateManyCompanyInputEnvelope
    set?: TicketWhereUniqueInput | TicketWhereUniqueInput[]
    disconnect?: TicketWhereUniqueInput | TicketWhereUniqueInput[]
    delete?: TicketWhereUniqueInput | TicketWhereUniqueInput[]
    connect?: TicketWhereUniqueInput | TicketWhereUniqueInput[]
    update?: TicketUpdateWithWhereUniqueWithoutCompanyInput | TicketUpdateWithWhereUniqueWithoutCompanyInput[]
    updateMany?: TicketUpdateManyWithWhereWithoutCompanyInput | TicketUpdateManyWithWhereWithoutCompanyInput[]
    deleteMany?: TicketScalarWhereInput | TicketScalarWhereInput[]
  }

  export type UserUncheckedUpdateManyWithoutCompanyNestedInput = {
    create?: XOR<UserCreateWithoutCompanyInput, UserUncheckedCreateWithoutCompanyInput> | UserCreateWithoutCompanyInput[] | UserUncheckedCreateWithoutCompanyInput[]
    connectOrCreate?: UserCreateOrConnectWithoutCompanyInput | UserCreateOrConnectWithoutCompanyInput[]
    upsert?: UserUpsertWithWhereUniqueWithoutCompanyInput | UserUpsertWithWhereUniqueWithoutCompanyInput[]
    createMany?: UserCreateManyCompanyInputEnvelope
    set?: UserWhereUniqueInput | UserWhereUniqueInput[]
    disconnect?: UserWhereUniqueInput | UserWhereUniqueInput[]
    delete?: UserWhereUniqueInput | UserWhereUniqueInput[]
    connect?: UserWhereUniqueInput | UserWhereUniqueInput[]
    update?: UserUpdateWithWhereUniqueWithoutCompanyInput | UserUpdateWithWhereUniqueWithoutCompanyInput[]
    updateMany?: UserUpdateManyWithWhereWithoutCompanyInput | UserUpdateManyWithWhereWithoutCompanyInput[]
    deleteMany?: UserScalarWhereInput | UserScalarWhereInput[]
  }

  export type ChannelUncheckedUpdateManyWithoutCompanyNestedInput = {
    create?: XOR<ChannelCreateWithoutCompanyInput, ChannelUncheckedCreateWithoutCompanyInput> | ChannelCreateWithoutCompanyInput[] | ChannelUncheckedCreateWithoutCompanyInput[]
    connectOrCreate?: ChannelCreateOrConnectWithoutCompanyInput | ChannelCreateOrConnectWithoutCompanyInput[]
    upsert?: ChannelUpsertWithWhereUniqueWithoutCompanyInput | ChannelUpsertWithWhereUniqueWithoutCompanyInput[]
    createMany?: ChannelCreateManyCompanyInputEnvelope
    set?: ChannelWhereUniqueInput | ChannelWhereUniqueInput[]
    disconnect?: ChannelWhereUniqueInput | ChannelWhereUniqueInput[]
    delete?: ChannelWhereUniqueInput | ChannelWhereUniqueInput[]
    connect?: ChannelWhereUniqueInput | ChannelWhereUniqueInput[]
    update?: ChannelUpdateWithWhereUniqueWithoutCompanyInput | ChannelUpdateWithWhereUniqueWithoutCompanyInput[]
    updateMany?: ChannelUpdateManyWithWhereWithoutCompanyInput | ChannelUpdateManyWithWhereWithoutCompanyInput[]
    deleteMany?: ChannelScalarWhereInput | ChannelScalarWhereInput[]
  }

  export type BotUncheckedUpdateManyWithoutCompanyNestedInput = {
    create?: XOR<BotCreateWithoutCompanyInput, BotUncheckedCreateWithoutCompanyInput> | BotCreateWithoutCompanyInput[] | BotUncheckedCreateWithoutCompanyInput[]
    connectOrCreate?: BotCreateOrConnectWithoutCompanyInput | BotCreateOrConnectWithoutCompanyInput[]
    upsert?: BotUpsertWithWhereUniqueWithoutCompanyInput | BotUpsertWithWhereUniqueWithoutCompanyInput[]
    createMany?: BotCreateManyCompanyInputEnvelope
    set?: BotWhereUniqueInput | BotWhereUniqueInput[]
    disconnect?: BotWhereUniqueInput | BotWhereUniqueInput[]
    delete?: BotWhereUniqueInput | BotWhereUniqueInput[]
    connect?: BotWhereUniqueInput | BotWhereUniqueInput[]
    update?: BotUpdateWithWhereUniqueWithoutCompanyInput | BotUpdateWithWhereUniqueWithoutCompanyInput[]
    updateMany?: BotUpdateManyWithWhereWithoutCompanyInput | BotUpdateManyWithWhereWithoutCompanyInput[]
    deleteMany?: BotScalarWhereInput | BotScalarWhereInput[]
  }

  export type ContactUncheckedUpdateManyWithoutCompanyNestedInput = {
    create?: XOR<ContactCreateWithoutCompanyInput, ContactUncheckedCreateWithoutCompanyInput> | ContactCreateWithoutCompanyInput[] | ContactUncheckedCreateWithoutCompanyInput[]
    connectOrCreate?: ContactCreateOrConnectWithoutCompanyInput | ContactCreateOrConnectWithoutCompanyInput[]
    upsert?: ContactUpsertWithWhereUniqueWithoutCompanyInput | ContactUpsertWithWhereUniqueWithoutCompanyInput[]
    createMany?: ContactCreateManyCompanyInputEnvelope
    set?: ContactWhereUniqueInput | ContactWhereUniqueInput[]
    disconnect?: ContactWhereUniqueInput | ContactWhereUniqueInput[]
    delete?: ContactWhereUniqueInput | ContactWhereUniqueInput[]
    connect?: ContactWhereUniqueInput | ContactWhereUniqueInput[]
    update?: ContactUpdateWithWhereUniqueWithoutCompanyInput | ContactUpdateWithWhereUniqueWithoutCompanyInput[]
    updateMany?: ContactUpdateManyWithWhereWithoutCompanyInput | ContactUpdateManyWithWhereWithoutCompanyInput[]
    deleteMany?: ContactScalarWhereInput | ContactScalarWhereInput[]
  }

  export type ConversationUncheckedUpdateManyWithoutCompanyNestedInput = {
    create?: XOR<ConversationCreateWithoutCompanyInput, ConversationUncheckedCreateWithoutCompanyInput> | ConversationCreateWithoutCompanyInput[] | ConversationUncheckedCreateWithoutCompanyInput[]
    connectOrCreate?: ConversationCreateOrConnectWithoutCompanyInput | ConversationCreateOrConnectWithoutCompanyInput[]
    upsert?: ConversationUpsertWithWhereUniqueWithoutCompanyInput | ConversationUpsertWithWhereUniqueWithoutCompanyInput[]
    createMany?: ConversationCreateManyCompanyInputEnvelope
    set?: ConversationWhereUniqueInput | ConversationWhereUniqueInput[]
    disconnect?: ConversationWhereUniqueInput | ConversationWhereUniqueInput[]
    delete?: ConversationWhereUniqueInput | ConversationWhereUniqueInput[]
    connect?: ConversationWhereUniqueInput | ConversationWhereUniqueInput[]
    update?: ConversationUpdateWithWhereUniqueWithoutCompanyInput | ConversationUpdateWithWhereUniqueWithoutCompanyInput[]
    updateMany?: ConversationUpdateManyWithWhereWithoutCompanyInput | ConversationUpdateManyWithWhereWithoutCompanyInput[]
    deleteMany?: ConversationScalarWhereInput | ConversationScalarWhereInput[]
  }

  export type TicketUncheckedUpdateManyWithoutCompanyNestedInput = {
    create?: XOR<TicketCreateWithoutCompanyInput, TicketUncheckedCreateWithoutCompanyInput> | TicketCreateWithoutCompanyInput[] | TicketUncheckedCreateWithoutCompanyInput[]
    connectOrCreate?: TicketCreateOrConnectWithoutCompanyInput | TicketCreateOrConnectWithoutCompanyInput[]
    upsert?: TicketUpsertWithWhereUniqueWithoutCompanyInput | TicketUpsertWithWhereUniqueWithoutCompanyInput[]
    createMany?: TicketCreateManyCompanyInputEnvelope
    set?: TicketWhereUniqueInput | TicketWhereUniqueInput[]
    disconnect?: TicketWhereUniqueInput | TicketWhereUniqueInput[]
    delete?: TicketWhereUniqueInput | TicketWhereUniqueInput[]
    connect?: TicketWhereUniqueInput | TicketWhereUniqueInput[]
    update?: TicketUpdateWithWhereUniqueWithoutCompanyInput | TicketUpdateWithWhereUniqueWithoutCompanyInput[]
    updateMany?: TicketUpdateManyWithWhereWithoutCompanyInput | TicketUpdateManyWithWhereWithoutCompanyInput[]
    deleteMany?: TicketScalarWhereInput | TicketScalarWhereInput[]
  }

  export type CompanyCreateNestedOneWithoutUsersInput = {
    create?: XOR<CompanyCreateWithoutUsersInput, CompanyUncheckedCreateWithoutUsersInput>
    connectOrCreate?: CompanyCreateOrConnectWithoutUsersInput
    connect?: CompanyWhereUniqueInput
  }

  export type ConversationCreateNestedManyWithoutAssigned_userInput = {
    create?: XOR<ConversationCreateWithoutAssigned_userInput, ConversationUncheckedCreateWithoutAssigned_userInput> | ConversationCreateWithoutAssigned_userInput[] | ConversationUncheckedCreateWithoutAssigned_userInput[]
    connectOrCreate?: ConversationCreateOrConnectWithoutAssigned_userInput | ConversationCreateOrConnectWithoutAssigned_userInput[]
    createMany?: ConversationCreateManyAssigned_userInputEnvelope
    connect?: ConversationWhereUniqueInput | ConversationWhereUniqueInput[]
  }

  export type TicketCreateNestedManyWithoutAssigned_userInput = {
    create?: XOR<TicketCreateWithoutAssigned_userInput, TicketUncheckedCreateWithoutAssigned_userInput> | TicketCreateWithoutAssigned_userInput[] | TicketUncheckedCreateWithoutAssigned_userInput[]
    connectOrCreate?: TicketCreateOrConnectWithoutAssigned_userInput | TicketCreateOrConnectWithoutAssigned_userInput[]
    createMany?: TicketCreateManyAssigned_userInputEnvelope
    connect?: TicketWhereUniqueInput | TicketWhereUniqueInput[]
  }

  export type ConversationUncheckedCreateNestedManyWithoutAssigned_userInput = {
    create?: XOR<ConversationCreateWithoutAssigned_userInput, ConversationUncheckedCreateWithoutAssigned_userInput> | ConversationCreateWithoutAssigned_userInput[] | ConversationUncheckedCreateWithoutAssigned_userInput[]
    connectOrCreate?: ConversationCreateOrConnectWithoutAssigned_userInput | ConversationCreateOrConnectWithoutAssigned_userInput[]
    createMany?: ConversationCreateManyAssigned_userInputEnvelope
    connect?: ConversationWhereUniqueInput | ConversationWhereUniqueInput[]
  }

  export type TicketUncheckedCreateNestedManyWithoutAssigned_userInput = {
    create?: XOR<TicketCreateWithoutAssigned_userInput, TicketUncheckedCreateWithoutAssigned_userInput> | TicketCreateWithoutAssigned_userInput[] | TicketUncheckedCreateWithoutAssigned_userInput[]
    connectOrCreate?: TicketCreateOrConnectWithoutAssigned_userInput | TicketCreateOrConnectWithoutAssigned_userInput[]
    createMany?: TicketCreateManyAssigned_userInputEnvelope
    connect?: TicketWhereUniqueInput | TicketWhereUniqueInput[]
  }

  export type BoolFieldUpdateOperationsInput = {
    set?: boolean
  }

  export type CompanyUpdateOneRequiredWithoutUsersNestedInput = {
    create?: XOR<CompanyCreateWithoutUsersInput, CompanyUncheckedCreateWithoutUsersInput>
    connectOrCreate?: CompanyCreateOrConnectWithoutUsersInput
    upsert?: CompanyUpsertWithoutUsersInput
    connect?: CompanyWhereUniqueInput
    update?: XOR<XOR<CompanyUpdateToOneWithWhereWithoutUsersInput, CompanyUpdateWithoutUsersInput>, CompanyUncheckedUpdateWithoutUsersInput>
  }

  export type ConversationUpdateManyWithoutAssigned_userNestedInput = {
    create?: XOR<ConversationCreateWithoutAssigned_userInput, ConversationUncheckedCreateWithoutAssigned_userInput> | ConversationCreateWithoutAssigned_userInput[] | ConversationUncheckedCreateWithoutAssigned_userInput[]
    connectOrCreate?: ConversationCreateOrConnectWithoutAssigned_userInput | ConversationCreateOrConnectWithoutAssigned_userInput[]
    upsert?: ConversationUpsertWithWhereUniqueWithoutAssigned_userInput | ConversationUpsertWithWhereUniqueWithoutAssigned_userInput[]
    createMany?: ConversationCreateManyAssigned_userInputEnvelope
    set?: ConversationWhereUniqueInput | ConversationWhereUniqueInput[]
    disconnect?: ConversationWhereUniqueInput | ConversationWhereUniqueInput[]
    delete?: ConversationWhereUniqueInput | ConversationWhereUniqueInput[]
    connect?: ConversationWhereUniqueInput | ConversationWhereUniqueInput[]
    update?: ConversationUpdateWithWhereUniqueWithoutAssigned_userInput | ConversationUpdateWithWhereUniqueWithoutAssigned_userInput[]
    updateMany?: ConversationUpdateManyWithWhereWithoutAssigned_userInput | ConversationUpdateManyWithWhereWithoutAssigned_userInput[]
    deleteMany?: ConversationScalarWhereInput | ConversationScalarWhereInput[]
  }

  export type TicketUpdateManyWithoutAssigned_userNestedInput = {
    create?: XOR<TicketCreateWithoutAssigned_userInput, TicketUncheckedCreateWithoutAssigned_userInput> | TicketCreateWithoutAssigned_userInput[] | TicketUncheckedCreateWithoutAssigned_userInput[]
    connectOrCreate?: TicketCreateOrConnectWithoutAssigned_userInput | TicketCreateOrConnectWithoutAssigned_userInput[]
    upsert?: TicketUpsertWithWhereUniqueWithoutAssigned_userInput | TicketUpsertWithWhereUniqueWithoutAssigned_userInput[]
    createMany?: TicketCreateManyAssigned_userInputEnvelope
    set?: TicketWhereUniqueInput | TicketWhereUniqueInput[]
    disconnect?: TicketWhereUniqueInput | TicketWhereUniqueInput[]
    delete?: TicketWhereUniqueInput | TicketWhereUniqueInput[]
    connect?: TicketWhereUniqueInput | TicketWhereUniqueInput[]
    update?: TicketUpdateWithWhereUniqueWithoutAssigned_userInput | TicketUpdateWithWhereUniqueWithoutAssigned_userInput[]
    updateMany?: TicketUpdateManyWithWhereWithoutAssigned_userInput | TicketUpdateManyWithWhereWithoutAssigned_userInput[]
    deleteMany?: TicketScalarWhereInput | TicketScalarWhereInput[]
  }

  export type ConversationUncheckedUpdateManyWithoutAssigned_userNestedInput = {
    create?: XOR<ConversationCreateWithoutAssigned_userInput, ConversationUncheckedCreateWithoutAssigned_userInput> | ConversationCreateWithoutAssigned_userInput[] | ConversationUncheckedCreateWithoutAssigned_userInput[]
    connectOrCreate?: ConversationCreateOrConnectWithoutAssigned_userInput | ConversationCreateOrConnectWithoutAssigned_userInput[]
    upsert?: ConversationUpsertWithWhereUniqueWithoutAssigned_userInput | ConversationUpsertWithWhereUniqueWithoutAssigned_userInput[]
    createMany?: ConversationCreateManyAssigned_userInputEnvelope
    set?: ConversationWhereUniqueInput | ConversationWhereUniqueInput[]
    disconnect?: ConversationWhereUniqueInput | ConversationWhereUniqueInput[]
    delete?: ConversationWhereUniqueInput | ConversationWhereUniqueInput[]
    connect?: ConversationWhereUniqueInput | ConversationWhereUniqueInput[]
    update?: ConversationUpdateWithWhereUniqueWithoutAssigned_userInput | ConversationUpdateWithWhereUniqueWithoutAssigned_userInput[]
    updateMany?: ConversationUpdateManyWithWhereWithoutAssigned_userInput | ConversationUpdateManyWithWhereWithoutAssigned_userInput[]
    deleteMany?: ConversationScalarWhereInput | ConversationScalarWhereInput[]
  }

  export type TicketUncheckedUpdateManyWithoutAssigned_userNestedInput = {
    create?: XOR<TicketCreateWithoutAssigned_userInput, TicketUncheckedCreateWithoutAssigned_userInput> | TicketCreateWithoutAssigned_userInput[] | TicketUncheckedCreateWithoutAssigned_userInput[]
    connectOrCreate?: TicketCreateOrConnectWithoutAssigned_userInput | TicketCreateOrConnectWithoutAssigned_userInput[]
    upsert?: TicketUpsertWithWhereUniqueWithoutAssigned_userInput | TicketUpsertWithWhereUniqueWithoutAssigned_userInput[]
    createMany?: TicketCreateManyAssigned_userInputEnvelope
    set?: TicketWhereUniqueInput | TicketWhereUniqueInput[]
    disconnect?: TicketWhereUniqueInput | TicketWhereUniqueInput[]
    delete?: TicketWhereUniqueInput | TicketWhereUniqueInput[]
    connect?: TicketWhereUniqueInput | TicketWhereUniqueInput[]
    update?: TicketUpdateWithWhereUniqueWithoutAssigned_userInput | TicketUpdateWithWhereUniqueWithoutAssigned_userInput[]
    updateMany?: TicketUpdateManyWithWhereWithoutAssigned_userInput | TicketUpdateManyWithWhereWithoutAssigned_userInput[]
    deleteMany?: TicketScalarWhereInput | TicketScalarWhereInput[]
  }

  export type CompanyCreateNestedOneWithoutChannelsInput = {
    create?: XOR<CompanyCreateWithoutChannelsInput, CompanyUncheckedCreateWithoutChannelsInput>
    connectOrCreate?: CompanyCreateOrConnectWithoutChannelsInput
    connect?: CompanyWhereUniqueInput
  }

  export type ConversationCreateNestedManyWithoutChannelInput = {
    create?: XOR<ConversationCreateWithoutChannelInput, ConversationUncheckedCreateWithoutChannelInput> | ConversationCreateWithoutChannelInput[] | ConversationUncheckedCreateWithoutChannelInput[]
    connectOrCreate?: ConversationCreateOrConnectWithoutChannelInput | ConversationCreateOrConnectWithoutChannelInput[]
    createMany?: ConversationCreateManyChannelInputEnvelope
    connect?: ConversationWhereUniqueInput | ConversationWhereUniqueInput[]
  }

  export type ChannelBotCreateNestedManyWithoutChannelInput = {
    create?: XOR<ChannelBotCreateWithoutChannelInput, ChannelBotUncheckedCreateWithoutChannelInput> | ChannelBotCreateWithoutChannelInput[] | ChannelBotUncheckedCreateWithoutChannelInput[]
    connectOrCreate?: ChannelBotCreateOrConnectWithoutChannelInput | ChannelBotCreateOrConnectWithoutChannelInput[]
    createMany?: ChannelBotCreateManyChannelInputEnvelope
    connect?: ChannelBotWhereUniqueInput | ChannelBotWhereUniqueInput[]
  }

  export type WebhookEventCreateNestedManyWithoutChannelInput = {
    create?: XOR<WebhookEventCreateWithoutChannelInput, WebhookEventUncheckedCreateWithoutChannelInput> | WebhookEventCreateWithoutChannelInput[] | WebhookEventUncheckedCreateWithoutChannelInput[]
    connectOrCreate?: WebhookEventCreateOrConnectWithoutChannelInput | WebhookEventCreateOrConnectWithoutChannelInput[]
    createMany?: WebhookEventCreateManyChannelInputEnvelope
    connect?: WebhookEventWhereUniqueInput | WebhookEventWhereUniqueInput[]
  }

  export type ConversationUncheckedCreateNestedManyWithoutChannelInput = {
    create?: XOR<ConversationCreateWithoutChannelInput, ConversationUncheckedCreateWithoutChannelInput> | ConversationCreateWithoutChannelInput[] | ConversationUncheckedCreateWithoutChannelInput[]
    connectOrCreate?: ConversationCreateOrConnectWithoutChannelInput | ConversationCreateOrConnectWithoutChannelInput[]
    createMany?: ConversationCreateManyChannelInputEnvelope
    connect?: ConversationWhereUniqueInput | ConversationWhereUniqueInput[]
  }

  export type ChannelBotUncheckedCreateNestedManyWithoutChannelInput = {
    create?: XOR<ChannelBotCreateWithoutChannelInput, ChannelBotUncheckedCreateWithoutChannelInput> | ChannelBotCreateWithoutChannelInput[] | ChannelBotUncheckedCreateWithoutChannelInput[]
    connectOrCreate?: ChannelBotCreateOrConnectWithoutChannelInput | ChannelBotCreateOrConnectWithoutChannelInput[]
    createMany?: ChannelBotCreateManyChannelInputEnvelope
    connect?: ChannelBotWhereUniqueInput | ChannelBotWhereUniqueInput[]
  }

  export type WebhookEventUncheckedCreateNestedManyWithoutChannelInput = {
    create?: XOR<WebhookEventCreateWithoutChannelInput, WebhookEventUncheckedCreateWithoutChannelInput> | WebhookEventCreateWithoutChannelInput[] | WebhookEventUncheckedCreateWithoutChannelInput[]
    connectOrCreate?: WebhookEventCreateOrConnectWithoutChannelInput | WebhookEventCreateOrConnectWithoutChannelInput[]
    createMany?: WebhookEventCreateManyChannelInputEnvelope
    connect?: WebhookEventWhereUniqueInput | WebhookEventWhereUniqueInput[]
  }

  export type NullableStringFieldUpdateOperationsInput = {
    set?: string | null
  }

  export type CompanyUpdateOneRequiredWithoutChannelsNestedInput = {
    create?: XOR<CompanyCreateWithoutChannelsInput, CompanyUncheckedCreateWithoutChannelsInput>
    connectOrCreate?: CompanyCreateOrConnectWithoutChannelsInput
    upsert?: CompanyUpsertWithoutChannelsInput
    connect?: CompanyWhereUniqueInput
    update?: XOR<XOR<CompanyUpdateToOneWithWhereWithoutChannelsInput, CompanyUpdateWithoutChannelsInput>, CompanyUncheckedUpdateWithoutChannelsInput>
  }

  export type ConversationUpdateManyWithoutChannelNestedInput = {
    create?: XOR<ConversationCreateWithoutChannelInput, ConversationUncheckedCreateWithoutChannelInput> | ConversationCreateWithoutChannelInput[] | ConversationUncheckedCreateWithoutChannelInput[]
    connectOrCreate?: ConversationCreateOrConnectWithoutChannelInput | ConversationCreateOrConnectWithoutChannelInput[]
    upsert?: ConversationUpsertWithWhereUniqueWithoutChannelInput | ConversationUpsertWithWhereUniqueWithoutChannelInput[]
    createMany?: ConversationCreateManyChannelInputEnvelope
    set?: ConversationWhereUniqueInput | ConversationWhereUniqueInput[]
    disconnect?: ConversationWhereUniqueInput | ConversationWhereUniqueInput[]
    delete?: ConversationWhereUniqueInput | ConversationWhereUniqueInput[]
    connect?: ConversationWhereUniqueInput | ConversationWhereUniqueInput[]
    update?: ConversationUpdateWithWhereUniqueWithoutChannelInput | ConversationUpdateWithWhereUniqueWithoutChannelInput[]
    updateMany?: ConversationUpdateManyWithWhereWithoutChannelInput | ConversationUpdateManyWithWhereWithoutChannelInput[]
    deleteMany?: ConversationScalarWhereInput | ConversationScalarWhereInput[]
  }

  export type ChannelBotUpdateManyWithoutChannelNestedInput = {
    create?: XOR<ChannelBotCreateWithoutChannelInput, ChannelBotUncheckedCreateWithoutChannelInput> | ChannelBotCreateWithoutChannelInput[] | ChannelBotUncheckedCreateWithoutChannelInput[]
    connectOrCreate?: ChannelBotCreateOrConnectWithoutChannelInput | ChannelBotCreateOrConnectWithoutChannelInput[]
    upsert?: ChannelBotUpsertWithWhereUniqueWithoutChannelInput | ChannelBotUpsertWithWhereUniqueWithoutChannelInput[]
    createMany?: ChannelBotCreateManyChannelInputEnvelope
    set?: ChannelBotWhereUniqueInput | ChannelBotWhereUniqueInput[]
    disconnect?: ChannelBotWhereUniqueInput | ChannelBotWhereUniqueInput[]
    delete?: ChannelBotWhereUniqueInput | ChannelBotWhereUniqueInput[]
    connect?: ChannelBotWhereUniqueInput | ChannelBotWhereUniqueInput[]
    update?: ChannelBotUpdateWithWhereUniqueWithoutChannelInput | ChannelBotUpdateWithWhereUniqueWithoutChannelInput[]
    updateMany?: ChannelBotUpdateManyWithWhereWithoutChannelInput | ChannelBotUpdateManyWithWhereWithoutChannelInput[]
    deleteMany?: ChannelBotScalarWhereInput | ChannelBotScalarWhereInput[]
  }

  export type WebhookEventUpdateManyWithoutChannelNestedInput = {
    create?: XOR<WebhookEventCreateWithoutChannelInput, WebhookEventUncheckedCreateWithoutChannelInput> | WebhookEventCreateWithoutChannelInput[] | WebhookEventUncheckedCreateWithoutChannelInput[]
    connectOrCreate?: WebhookEventCreateOrConnectWithoutChannelInput | WebhookEventCreateOrConnectWithoutChannelInput[]
    upsert?: WebhookEventUpsertWithWhereUniqueWithoutChannelInput | WebhookEventUpsertWithWhereUniqueWithoutChannelInput[]
    createMany?: WebhookEventCreateManyChannelInputEnvelope
    set?: WebhookEventWhereUniqueInput | WebhookEventWhereUniqueInput[]
    disconnect?: WebhookEventWhereUniqueInput | WebhookEventWhereUniqueInput[]
    delete?: WebhookEventWhereUniqueInput | WebhookEventWhereUniqueInput[]
    connect?: WebhookEventWhereUniqueInput | WebhookEventWhereUniqueInput[]
    update?: WebhookEventUpdateWithWhereUniqueWithoutChannelInput | WebhookEventUpdateWithWhereUniqueWithoutChannelInput[]
    updateMany?: WebhookEventUpdateManyWithWhereWithoutChannelInput | WebhookEventUpdateManyWithWhereWithoutChannelInput[]
    deleteMany?: WebhookEventScalarWhereInput | WebhookEventScalarWhereInput[]
  }

  export type ConversationUncheckedUpdateManyWithoutChannelNestedInput = {
    create?: XOR<ConversationCreateWithoutChannelInput, ConversationUncheckedCreateWithoutChannelInput> | ConversationCreateWithoutChannelInput[] | ConversationUncheckedCreateWithoutChannelInput[]
    connectOrCreate?: ConversationCreateOrConnectWithoutChannelInput | ConversationCreateOrConnectWithoutChannelInput[]
    upsert?: ConversationUpsertWithWhereUniqueWithoutChannelInput | ConversationUpsertWithWhereUniqueWithoutChannelInput[]
    createMany?: ConversationCreateManyChannelInputEnvelope
    set?: ConversationWhereUniqueInput | ConversationWhereUniqueInput[]
    disconnect?: ConversationWhereUniqueInput | ConversationWhereUniqueInput[]
    delete?: ConversationWhereUniqueInput | ConversationWhereUniqueInput[]
    connect?: ConversationWhereUniqueInput | ConversationWhereUniqueInput[]
    update?: ConversationUpdateWithWhereUniqueWithoutChannelInput | ConversationUpdateWithWhereUniqueWithoutChannelInput[]
    updateMany?: ConversationUpdateManyWithWhereWithoutChannelInput | ConversationUpdateManyWithWhereWithoutChannelInput[]
    deleteMany?: ConversationScalarWhereInput | ConversationScalarWhereInput[]
  }

  export type ChannelBotUncheckedUpdateManyWithoutChannelNestedInput = {
    create?: XOR<ChannelBotCreateWithoutChannelInput, ChannelBotUncheckedCreateWithoutChannelInput> | ChannelBotCreateWithoutChannelInput[] | ChannelBotUncheckedCreateWithoutChannelInput[]
    connectOrCreate?: ChannelBotCreateOrConnectWithoutChannelInput | ChannelBotCreateOrConnectWithoutChannelInput[]
    upsert?: ChannelBotUpsertWithWhereUniqueWithoutChannelInput | ChannelBotUpsertWithWhereUniqueWithoutChannelInput[]
    createMany?: ChannelBotCreateManyChannelInputEnvelope
    set?: ChannelBotWhereUniqueInput | ChannelBotWhereUniqueInput[]
    disconnect?: ChannelBotWhereUniqueInput | ChannelBotWhereUniqueInput[]
    delete?: ChannelBotWhereUniqueInput | ChannelBotWhereUniqueInput[]
    connect?: ChannelBotWhereUniqueInput | ChannelBotWhereUniqueInput[]
    update?: ChannelBotUpdateWithWhereUniqueWithoutChannelInput | ChannelBotUpdateWithWhereUniqueWithoutChannelInput[]
    updateMany?: ChannelBotUpdateManyWithWhereWithoutChannelInput | ChannelBotUpdateManyWithWhereWithoutChannelInput[]
    deleteMany?: ChannelBotScalarWhereInput | ChannelBotScalarWhereInput[]
  }

  export type WebhookEventUncheckedUpdateManyWithoutChannelNestedInput = {
    create?: XOR<WebhookEventCreateWithoutChannelInput, WebhookEventUncheckedCreateWithoutChannelInput> | WebhookEventCreateWithoutChannelInput[] | WebhookEventUncheckedCreateWithoutChannelInput[]
    connectOrCreate?: WebhookEventCreateOrConnectWithoutChannelInput | WebhookEventCreateOrConnectWithoutChannelInput[]
    upsert?: WebhookEventUpsertWithWhereUniqueWithoutChannelInput | WebhookEventUpsertWithWhereUniqueWithoutChannelInput[]
    createMany?: WebhookEventCreateManyChannelInputEnvelope
    set?: WebhookEventWhereUniqueInput | WebhookEventWhereUniqueInput[]
    disconnect?: WebhookEventWhereUniqueInput | WebhookEventWhereUniqueInput[]
    delete?: WebhookEventWhereUniqueInput | WebhookEventWhereUniqueInput[]
    connect?: WebhookEventWhereUniqueInput | WebhookEventWhereUniqueInput[]
    update?: WebhookEventUpdateWithWhereUniqueWithoutChannelInput | WebhookEventUpdateWithWhereUniqueWithoutChannelInput[]
    updateMany?: WebhookEventUpdateManyWithWhereWithoutChannelInput | WebhookEventUpdateManyWithWhereWithoutChannelInput[]
    deleteMany?: WebhookEventScalarWhereInput | WebhookEventScalarWhereInput[]
  }

  export type CompanyCreateNestedOneWithoutBotsInput = {
    create?: XOR<CompanyCreateWithoutBotsInput, CompanyUncheckedCreateWithoutBotsInput>
    connectOrCreate?: CompanyCreateOrConnectWithoutBotsInput
    connect?: CompanyWhereUniqueInput
  }

  export type ConversationCreateNestedManyWithoutBotInput = {
    create?: XOR<ConversationCreateWithoutBotInput, ConversationUncheckedCreateWithoutBotInput> | ConversationCreateWithoutBotInput[] | ConversationUncheckedCreateWithoutBotInput[]
    connectOrCreate?: ConversationCreateOrConnectWithoutBotInput | ConversationCreateOrConnectWithoutBotInput[]
    createMany?: ConversationCreateManyBotInputEnvelope
    connect?: ConversationWhereUniqueInput | ConversationWhereUniqueInput[]
  }

  export type ChannelBotCreateNestedManyWithoutBotInput = {
    create?: XOR<ChannelBotCreateWithoutBotInput, ChannelBotUncheckedCreateWithoutBotInput> | ChannelBotCreateWithoutBotInput[] | ChannelBotUncheckedCreateWithoutBotInput[]
    connectOrCreate?: ChannelBotCreateOrConnectWithoutBotInput | ChannelBotCreateOrConnectWithoutBotInput[]
    createMany?: ChannelBotCreateManyBotInputEnvelope
    connect?: ChannelBotWhereUniqueInput | ChannelBotWhereUniqueInput[]
  }

  export type ConversationUncheckedCreateNestedManyWithoutBotInput = {
    create?: XOR<ConversationCreateWithoutBotInput, ConversationUncheckedCreateWithoutBotInput> | ConversationCreateWithoutBotInput[] | ConversationUncheckedCreateWithoutBotInput[]
    connectOrCreate?: ConversationCreateOrConnectWithoutBotInput | ConversationCreateOrConnectWithoutBotInput[]
    createMany?: ConversationCreateManyBotInputEnvelope
    connect?: ConversationWhereUniqueInput | ConversationWhereUniqueInput[]
  }

  export type ChannelBotUncheckedCreateNestedManyWithoutBotInput = {
    create?: XOR<ChannelBotCreateWithoutBotInput, ChannelBotUncheckedCreateWithoutBotInput> | ChannelBotCreateWithoutBotInput[] | ChannelBotUncheckedCreateWithoutBotInput[]
    connectOrCreate?: ChannelBotCreateOrConnectWithoutBotInput | ChannelBotCreateOrConnectWithoutBotInput[]
    createMany?: ChannelBotCreateManyBotInputEnvelope
    connect?: ChannelBotWhereUniqueInput | ChannelBotWhereUniqueInput[]
  }

  export type CompanyUpdateOneRequiredWithoutBotsNestedInput = {
    create?: XOR<CompanyCreateWithoutBotsInput, CompanyUncheckedCreateWithoutBotsInput>
    connectOrCreate?: CompanyCreateOrConnectWithoutBotsInput
    upsert?: CompanyUpsertWithoutBotsInput
    connect?: CompanyWhereUniqueInput
    update?: XOR<XOR<CompanyUpdateToOneWithWhereWithoutBotsInput, CompanyUpdateWithoutBotsInput>, CompanyUncheckedUpdateWithoutBotsInput>
  }

  export type ConversationUpdateManyWithoutBotNestedInput = {
    create?: XOR<ConversationCreateWithoutBotInput, ConversationUncheckedCreateWithoutBotInput> | ConversationCreateWithoutBotInput[] | ConversationUncheckedCreateWithoutBotInput[]
    connectOrCreate?: ConversationCreateOrConnectWithoutBotInput | ConversationCreateOrConnectWithoutBotInput[]
    upsert?: ConversationUpsertWithWhereUniqueWithoutBotInput | ConversationUpsertWithWhereUniqueWithoutBotInput[]
    createMany?: ConversationCreateManyBotInputEnvelope
    set?: ConversationWhereUniqueInput | ConversationWhereUniqueInput[]
    disconnect?: ConversationWhereUniqueInput | ConversationWhereUniqueInput[]
    delete?: ConversationWhereUniqueInput | ConversationWhereUniqueInput[]
    connect?: ConversationWhereUniqueInput | ConversationWhereUniqueInput[]
    update?: ConversationUpdateWithWhereUniqueWithoutBotInput | ConversationUpdateWithWhereUniqueWithoutBotInput[]
    updateMany?: ConversationUpdateManyWithWhereWithoutBotInput | ConversationUpdateManyWithWhereWithoutBotInput[]
    deleteMany?: ConversationScalarWhereInput | ConversationScalarWhereInput[]
  }

  export type ChannelBotUpdateManyWithoutBotNestedInput = {
    create?: XOR<ChannelBotCreateWithoutBotInput, ChannelBotUncheckedCreateWithoutBotInput> | ChannelBotCreateWithoutBotInput[] | ChannelBotUncheckedCreateWithoutBotInput[]
    connectOrCreate?: ChannelBotCreateOrConnectWithoutBotInput | ChannelBotCreateOrConnectWithoutBotInput[]
    upsert?: ChannelBotUpsertWithWhereUniqueWithoutBotInput | ChannelBotUpsertWithWhereUniqueWithoutBotInput[]
    createMany?: ChannelBotCreateManyBotInputEnvelope
    set?: ChannelBotWhereUniqueInput | ChannelBotWhereUniqueInput[]
    disconnect?: ChannelBotWhereUniqueInput | ChannelBotWhereUniqueInput[]
    delete?: ChannelBotWhereUniqueInput | ChannelBotWhereUniqueInput[]
    connect?: ChannelBotWhereUniqueInput | ChannelBotWhereUniqueInput[]
    update?: ChannelBotUpdateWithWhereUniqueWithoutBotInput | ChannelBotUpdateWithWhereUniqueWithoutBotInput[]
    updateMany?: ChannelBotUpdateManyWithWhereWithoutBotInput | ChannelBotUpdateManyWithWhereWithoutBotInput[]
    deleteMany?: ChannelBotScalarWhereInput | ChannelBotScalarWhereInput[]
  }

  export type ConversationUncheckedUpdateManyWithoutBotNestedInput = {
    create?: XOR<ConversationCreateWithoutBotInput, ConversationUncheckedCreateWithoutBotInput> | ConversationCreateWithoutBotInput[] | ConversationUncheckedCreateWithoutBotInput[]
    connectOrCreate?: ConversationCreateOrConnectWithoutBotInput | ConversationCreateOrConnectWithoutBotInput[]
    upsert?: ConversationUpsertWithWhereUniqueWithoutBotInput | ConversationUpsertWithWhereUniqueWithoutBotInput[]
    createMany?: ConversationCreateManyBotInputEnvelope
    set?: ConversationWhereUniqueInput | ConversationWhereUniqueInput[]
    disconnect?: ConversationWhereUniqueInput | ConversationWhereUniqueInput[]
    delete?: ConversationWhereUniqueInput | ConversationWhereUniqueInput[]
    connect?: ConversationWhereUniqueInput | ConversationWhereUniqueInput[]
    update?: ConversationUpdateWithWhereUniqueWithoutBotInput | ConversationUpdateWithWhereUniqueWithoutBotInput[]
    updateMany?: ConversationUpdateManyWithWhereWithoutBotInput | ConversationUpdateManyWithWhereWithoutBotInput[]
    deleteMany?: ConversationScalarWhereInput | ConversationScalarWhereInput[]
  }

  export type ChannelBotUncheckedUpdateManyWithoutBotNestedInput = {
    create?: XOR<ChannelBotCreateWithoutBotInput, ChannelBotUncheckedCreateWithoutBotInput> | ChannelBotCreateWithoutBotInput[] | ChannelBotUncheckedCreateWithoutBotInput[]
    connectOrCreate?: ChannelBotCreateOrConnectWithoutBotInput | ChannelBotCreateOrConnectWithoutBotInput[]
    upsert?: ChannelBotUpsertWithWhereUniqueWithoutBotInput | ChannelBotUpsertWithWhereUniqueWithoutBotInput[]
    createMany?: ChannelBotCreateManyBotInputEnvelope
    set?: ChannelBotWhereUniqueInput | ChannelBotWhereUniqueInput[]
    disconnect?: ChannelBotWhereUniqueInput | ChannelBotWhereUniqueInput[]
    delete?: ChannelBotWhereUniqueInput | ChannelBotWhereUniqueInput[]
    connect?: ChannelBotWhereUniqueInput | ChannelBotWhereUniqueInput[]
    update?: ChannelBotUpdateWithWhereUniqueWithoutBotInput | ChannelBotUpdateWithWhereUniqueWithoutBotInput[]
    updateMany?: ChannelBotUpdateManyWithWhereWithoutBotInput | ChannelBotUpdateManyWithWhereWithoutBotInput[]
    deleteMany?: ChannelBotScalarWhereInput | ChannelBotScalarWhereInput[]
  }

  export type ChannelCreateNestedOneWithoutChannel_botsInput = {
    create?: XOR<ChannelCreateWithoutChannel_botsInput, ChannelUncheckedCreateWithoutChannel_botsInput>
    connectOrCreate?: ChannelCreateOrConnectWithoutChannel_botsInput
    connect?: ChannelWhereUniqueInput
  }

  export type BotCreateNestedOneWithoutChannel_botsInput = {
    create?: XOR<BotCreateWithoutChannel_botsInput, BotUncheckedCreateWithoutChannel_botsInput>
    connectOrCreate?: BotCreateOrConnectWithoutChannel_botsInput
    connect?: BotWhereUniqueInput
  }

  export type ChannelUpdateOneRequiredWithoutChannel_botsNestedInput = {
    create?: XOR<ChannelCreateWithoutChannel_botsInput, ChannelUncheckedCreateWithoutChannel_botsInput>
    connectOrCreate?: ChannelCreateOrConnectWithoutChannel_botsInput
    upsert?: ChannelUpsertWithoutChannel_botsInput
    connect?: ChannelWhereUniqueInput
    update?: XOR<XOR<ChannelUpdateToOneWithWhereWithoutChannel_botsInput, ChannelUpdateWithoutChannel_botsInput>, ChannelUncheckedUpdateWithoutChannel_botsInput>
  }

  export type BotUpdateOneRequiredWithoutChannel_botsNestedInput = {
    create?: XOR<BotCreateWithoutChannel_botsInput, BotUncheckedCreateWithoutChannel_botsInput>
    connectOrCreate?: BotCreateOrConnectWithoutChannel_botsInput
    upsert?: BotUpsertWithoutChannel_botsInput
    connect?: BotWhereUniqueInput
    update?: XOR<XOR<BotUpdateToOneWithWhereWithoutChannel_botsInput, BotUpdateWithoutChannel_botsInput>, BotUncheckedUpdateWithoutChannel_botsInput>
  }

  export type CompanyCreateNestedOneWithoutContactsInput = {
    create?: XOR<CompanyCreateWithoutContactsInput, CompanyUncheckedCreateWithoutContactsInput>
    connectOrCreate?: CompanyCreateOrConnectWithoutContactsInput
    connect?: CompanyWhereUniqueInput
  }

  export type ConversationCreateNestedManyWithoutContactInput = {
    create?: XOR<ConversationCreateWithoutContactInput, ConversationUncheckedCreateWithoutContactInput> | ConversationCreateWithoutContactInput[] | ConversationUncheckedCreateWithoutContactInput[]
    connectOrCreate?: ConversationCreateOrConnectWithoutContactInput | ConversationCreateOrConnectWithoutContactInput[]
    createMany?: ConversationCreateManyContactInputEnvelope
    connect?: ConversationWhereUniqueInput | ConversationWhereUniqueInput[]
  }

  export type ConversationUncheckedCreateNestedManyWithoutContactInput = {
    create?: XOR<ConversationCreateWithoutContactInput, ConversationUncheckedCreateWithoutContactInput> | ConversationCreateWithoutContactInput[] | ConversationUncheckedCreateWithoutContactInput[]
    connectOrCreate?: ConversationCreateOrConnectWithoutContactInput | ConversationCreateOrConnectWithoutContactInput[]
    createMany?: ConversationCreateManyContactInputEnvelope
    connect?: ConversationWhereUniqueInput | ConversationWhereUniqueInput[]
  }

  export type CompanyUpdateOneRequiredWithoutContactsNestedInput = {
    create?: XOR<CompanyCreateWithoutContactsInput, CompanyUncheckedCreateWithoutContactsInput>
    connectOrCreate?: CompanyCreateOrConnectWithoutContactsInput
    upsert?: CompanyUpsertWithoutContactsInput
    connect?: CompanyWhereUniqueInput
    update?: XOR<XOR<CompanyUpdateToOneWithWhereWithoutContactsInput, CompanyUpdateWithoutContactsInput>, CompanyUncheckedUpdateWithoutContactsInput>
  }

  export type ConversationUpdateManyWithoutContactNestedInput = {
    create?: XOR<ConversationCreateWithoutContactInput, ConversationUncheckedCreateWithoutContactInput> | ConversationCreateWithoutContactInput[] | ConversationUncheckedCreateWithoutContactInput[]
    connectOrCreate?: ConversationCreateOrConnectWithoutContactInput | ConversationCreateOrConnectWithoutContactInput[]
    upsert?: ConversationUpsertWithWhereUniqueWithoutContactInput | ConversationUpsertWithWhereUniqueWithoutContactInput[]
    createMany?: ConversationCreateManyContactInputEnvelope
    set?: ConversationWhereUniqueInput | ConversationWhereUniqueInput[]
    disconnect?: ConversationWhereUniqueInput | ConversationWhereUniqueInput[]
    delete?: ConversationWhereUniqueInput | ConversationWhereUniqueInput[]
    connect?: ConversationWhereUniqueInput | ConversationWhereUniqueInput[]
    update?: ConversationUpdateWithWhereUniqueWithoutContactInput | ConversationUpdateWithWhereUniqueWithoutContactInput[]
    updateMany?: ConversationUpdateManyWithWhereWithoutContactInput | ConversationUpdateManyWithWhereWithoutContactInput[]
    deleteMany?: ConversationScalarWhereInput | ConversationScalarWhereInput[]
  }

  export type ConversationUncheckedUpdateManyWithoutContactNestedInput = {
    create?: XOR<ConversationCreateWithoutContactInput, ConversationUncheckedCreateWithoutContactInput> | ConversationCreateWithoutContactInput[] | ConversationUncheckedCreateWithoutContactInput[]
    connectOrCreate?: ConversationCreateOrConnectWithoutContactInput | ConversationCreateOrConnectWithoutContactInput[]
    upsert?: ConversationUpsertWithWhereUniqueWithoutContactInput | ConversationUpsertWithWhereUniqueWithoutContactInput[]
    createMany?: ConversationCreateManyContactInputEnvelope
    set?: ConversationWhereUniqueInput | ConversationWhereUniqueInput[]
    disconnect?: ConversationWhereUniqueInput | ConversationWhereUniqueInput[]
    delete?: ConversationWhereUniqueInput | ConversationWhereUniqueInput[]
    connect?: ConversationWhereUniqueInput | ConversationWhereUniqueInput[]
    update?: ConversationUpdateWithWhereUniqueWithoutContactInput | ConversationUpdateWithWhereUniqueWithoutContactInput[]
    updateMany?: ConversationUpdateManyWithWhereWithoutContactInput | ConversationUpdateManyWithWhereWithoutContactInput[]
    deleteMany?: ConversationScalarWhereInput | ConversationScalarWhereInput[]
  }

  export type ContactCreateNestedOneWithoutConversationsInput = {
    create?: XOR<ContactCreateWithoutConversationsInput, ContactUncheckedCreateWithoutConversationsInput>
    connectOrCreate?: ContactCreateOrConnectWithoutConversationsInput
    connect?: ContactWhereUniqueInput
  }

  export type ChannelCreateNestedOneWithoutConversationsInput = {
    create?: XOR<ChannelCreateWithoutConversationsInput, ChannelUncheckedCreateWithoutConversationsInput>
    connectOrCreate?: ChannelCreateOrConnectWithoutConversationsInput
    connect?: ChannelWhereUniqueInput
  }

  export type BotCreateNestedOneWithoutConversationsInput = {
    create?: XOR<BotCreateWithoutConversationsInput, BotUncheckedCreateWithoutConversationsInput>
    connectOrCreate?: BotCreateOrConnectWithoutConversationsInput
    connect?: BotWhereUniqueInput
  }

  export type UserCreateNestedOneWithoutAssigned_conversationsInput = {
    create?: XOR<UserCreateWithoutAssigned_conversationsInput, UserUncheckedCreateWithoutAssigned_conversationsInput>
    connectOrCreate?: UserCreateOrConnectWithoutAssigned_conversationsInput
    connect?: UserWhereUniqueInput
  }

  export type CompanyCreateNestedOneWithoutConversationsInput = {
    create?: XOR<CompanyCreateWithoutConversationsInput, CompanyUncheckedCreateWithoutConversationsInput>
    connectOrCreate?: CompanyCreateOrConnectWithoutConversationsInput
    connect?: CompanyWhereUniqueInput
  }

  export type MessageCreateNestedManyWithoutConversationInput = {
    create?: XOR<MessageCreateWithoutConversationInput, MessageUncheckedCreateWithoutConversationInput> | MessageCreateWithoutConversationInput[] | MessageUncheckedCreateWithoutConversationInput[]
    connectOrCreate?: MessageCreateOrConnectWithoutConversationInput | MessageCreateOrConnectWithoutConversationInput[]
    createMany?: MessageCreateManyConversationInputEnvelope
    connect?: MessageWhereUniqueInput | MessageWhereUniqueInput[]
  }

  export type TicketCreateNestedManyWithoutConversationInput = {
    create?: XOR<TicketCreateWithoutConversationInput, TicketUncheckedCreateWithoutConversationInput> | TicketCreateWithoutConversationInput[] | TicketUncheckedCreateWithoutConversationInput[]
    connectOrCreate?: TicketCreateOrConnectWithoutConversationInput | TicketCreateOrConnectWithoutConversationInput[]
    createMany?: TicketCreateManyConversationInputEnvelope
    connect?: TicketWhereUniqueInput | TicketWhereUniqueInput[]
  }

  export type MessageUncheckedCreateNestedManyWithoutConversationInput = {
    create?: XOR<MessageCreateWithoutConversationInput, MessageUncheckedCreateWithoutConversationInput> | MessageCreateWithoutConversationInput[] | MessageUncheckedCreateWithoutConversationInput[]
    connectOrCreate?: MessageCreateOrConnectWithoutConversationInput | MessageCreateOrConnectWithoutConversationInput[]
    createMany?: MessageCreateManyConversationInputEnvelope
    connect?: MessageWhereUniqueInput | MessageWhereUniqueInput[]
  }

  export type TicketUncheckedCreateNestedManyWithoutConversationInput = {
    create?: XOR<TicketCreateWithoutConversationInput, TicketUncheckedCreateWithoutConversationInput> | TicketCreateWithoutConversationInput[] | TicketUncheckedCreateWithoutConversationInput[]
    connectOrCreate?: TicketCreateOrConnectWithoutConversationInput | TicketCreateOrConnectWithoutConversationInput[]
    createMany?: TicketCreateManyConversationInputEnvelope
    connect?: TicketWhereUniqueInput | TicketWhereUniqueInput[]
  }

  export type ContactUpdateOneRequiredWithoutConversationsNestedInput = {
    create?: XOR<ContactCreateWithoutConversationsInput, ContactUncheckedCreateWithoutConversationsInput>
    connectOrCreate?: ContactCreateOrConnectWithoutConversationsInput
    upsert?: ContactUpsertWithoutConversationsInput
    connect?: ContactWhereUniqueInput
    update?: XOR<XOR<ContactUpdateToOneWithWhereWithoutConversationsInput, ContactUpdateWithoutConversationsInput>, ContactUncheckedUpdateWithoutConversationsInput>
  }

  export type ChannelUpdateOneRequiredWithoutConversationsNestedInput = {
    create?: XOR<ChannelCreateWithoutConversationsInput, ChannelUncheckedCreateWithoutConversationsInput>
    connectOrCreate?: ChannelCreateOrConnectWithoutConversationsInput
    upsert?: ChannelUpsertWithoutConversationsInput
    connect?: ChannelWhereUniqueInput
    update?: XOR<XOR<ChannelUpdateToOneWithWhereWithoutConversationsInput, ChannelUpdateWithoutConversationsInput>, ChannelUncheckedUpdateWithoutConversationsInput>
  }

  export type BotUpdateOneWithoutConversationsNestedInput = {
    create?: XOR<BotCreateWithoutConversationsInput, BotUncheckedCreateWithoutConversationsInput>
    connectOrCreate?: BotCreateOrConnectWithoutConversationsInput
    upsert?: BotUpsertWithoutConversationsInput
    disconnect?: BotWhereInput | boolean
    delete?: BotWhereInput | boolean
    connect?: BotWhereUniqueInput
    update?: XOR<XOR<BotUpdateToOneWithWhereWithoutConversationsInput, BotUpdateWithoutConversationsInput>, BotUncheckedUpdateWithoutConversationsInput>
  }

  export type UserUpdateOneWithoutAssigned_conversationsNestedInput = {
    create?: XOR<UserCreateWithoutAssigned_conversationsInput, UserUncheckedCreateWithoutAssigned_conversationsInput>
    connectOrCreate?: UserCreateOrConnectWithoutAssigned_conversationsInput
    upsert?: UserUpsertWithoutAssigned_conversationsInput
    disconnect?: UserWhereInput | boolean
    delete?: UserWhereInput | boolean
    connect?: UserWhereUniqueInput
    update?: XOR<XOR<UserUpdateToOneWithWhereWithoutAssigned_conversationsInput, UserUpdateWithoutAssigned_conversationsInput>, UserUncheckedUpdateWithoutAssigned_conversationsInput>
  }

  export type CompanyUpdateOneRequiredWithoutConversationsNestedInput = {
    create?: XOR<CompanyCreateWithoutConversationsInput, CompanyUncheckedCreateWithoutConversationsInput>
    connectOrCreate?: CompanyCreateOrConnectWithoutConversationsInput
    upsert?: CompanyUpsertWithoutConversationsInput
    connect?: CompanyWhereUniqueInput
    update?: XOR<XOR<CompanyUpdateToOneWithWhereWithoutConversationsInput, CompanyUpdateWithoutConversationsInput>, CompanyUncheckedUpdateWithoutConversationsInput>
  }

  export type MessageUpdateManyWithoutConversationNestedInput = {
    create?: XOR<MessageCreateWithoutConversationInput, MessageUncheckedCreateWithoutConversationInput> | MessageCreateWithoutConversationInput[] | MessageUncheckedCreateWithoutConversationInput[]
    connectOrCreate?: MessageCreateOrConnectWithoutConversationInput | MessageCreateOrConnectWithoutConversationInput[]
    upsert?: MessageUpsertWithWhereUniqueWithoutConversationInput | MessageUpsertWithWhereUniqueWithoutConversationInput[]
    createMany?: MessageCreateManyConversationInputEnvelope
    set?: MessageWhereUniqueInput | MessageWhereUniqueInput[]
    disconnect?: MessageWhereUniqueInput | MessageWhereUniqueInput[]
    delete?: MessageWhereUniqueInput | MessageWhereUniqueInput[]
    connect?: MessageWhereUniqueInput | MessageWhereUniqueInput[]
    update?: MessageUpdateWithWhereUniqueWithoutConversationInput | MessageUpdateWithWhereUniqueWithoutConversationInput[]
    updateMany?: MessageUpdateManyWithWhereWithoutConversationInput | MessageUpdateManyWithWhereWithoutConversationInput[]
    deleteMany?: MessageScalarWhereInput | MessageScalarWhereInput[]
  }

  export type TicketUpdateManyWithoutConversationNestedInput = {
    create?: XOR<TicketCreateWithoutConversationInput, TicketUncheckedCreateWithoutConversationInput> | TicketCreateWithoutConversationInput[] | TicketUncheckedCreateWithoutConversationInput[]
    connectOrCreate?: TicketCreateOrConnectWithoutConversationInput | TicketCreateOrConnectWithoutConversationInput[]
    upsert?: TicketUpsertWithWhereUniqueWithoutConversationInput | TicketUpsertWithWhereUniqueWithoutConversationInput[]
    createMany?: TicketCreateManyConversationInputEnvelope
    set?: TicketWhereUniqueInput | TicketWhereUniqueInput[]
    disconnect?: TicketWhereUniqueInput | TicketWhereUniqueInput[]
    delete?: TicketWhereUniqueInput | TicketWhereUniqueInput[]
    connect?: TicketWhereUniqueInput | TicketWhereUniqueInput[]
    update?: TicketUpdateWithWhereUniqueWithoutConversationInput | TicketUpdateWithWhereUniqueWithoutConversationInput[]
    updateMany?: TicketUpdateManyWithWhereWithoutConversationInput | TicketUpdateManyWithWhereWithoutConversationInput[]
    deleteMany?: TicketScalarWhereInput | TicketScalarWhereInput[]
  }

  export type MessageUncheckedUpdateManyWithoutConversationNestedInput = {
    create?: XOR<MessageCreateWithoutConversationInput, MessageUncheckedCreateWithoutConversationInput> | MessageCreateWithoutConversationInput[] | MessageUncheckedCreateWithoutConversationInput[]
    connectOrCreate?: MessageCreateOrConnectWithoutConversationInput | MessageCreateOrConnectWithoutConversationInput[]
    upsert?: MessageUpsertWithWhereUniqueWithoutConversationInput | MessageUpsertWithWhereUniqueWithoutConversationInput[]
    createMany?: MessageCreateManyConversationInputEnvelope
    set?: MessageWhereUniqueInput | MessageWhereUniqueInput[]
    disconnect?: MessageWhereUniqueInput | MessageWhereUniqueInput[]
    delete?: MessageWhereUniqueInput | MessageWhereUniqueInput[]
    connect?: MessageWhereUniqueInput | MessageWhereUniqueInput[]
    update?: MessageUpdateWithWhereUniqueWithoutConversationInput | MessageUpdateWithWhereUniqueWithoutConversationInput[]
    updateMany?: MessageUpdateManyWithWhereWithoutConversationInput | MessageUpdateManyWithWhereWithoutConversationInput[]
    deleteMany?: MessageScalarWhereInput | MessageScalarWhereInput[]
  }

  export type TicketUncheckedUpdateManyWithoutConversationNestedInput = {
    create?: XOR<TicketCreateWithoutConversationInput, TicketUncheckedCreateWithoutConversationInput> | TicketCreateWithoutConversationInput[] | TicketUncheckedCreateWithoutConversationInput[]
    connectOrCreate?: TicketCreateOrConnectWithoutConversationInput | TicketCreateOrConnectWithoutConversationInput[]
    upsert?: TicketUpsertWithWhereUniqueWithoutConversationInput | TicketUpsertWithWhereUniqueWithoutConversationInput[]
    createMany?: TicketCreateManyConversationInputEnvelope
    set?: TicketWhereUniqueInput | TicketWhereUniqueInput[]
    disconnect?: TicketWhereUniqueInput | TicketWhereUniqueInput[]
    delete?: TicketWhereUniqueInput | TicketWhereUniqueInput[]
    connect?: TicketWhereUniqueInput | TicketWhereUniqueInput[]
    update?: TicketUpdateWithWhereUniqueWithoutConversationInput | TicketUpdateWithWhereUniqueWithoutConversationInput[]
    updateMany?: TicketUpdateManyWithWhereWithoutConversationInput | TicketUpdateManyWithWhereWithoutConversationInput[]
    deleteMany?: TicketScalarWhereInput | TicketScalarWhereInput[]
  }

  export type ConversationCreateNestedOneWithoutMessagesInput = {
    create?: XOR<ConversationCreateWithoutMessagesInput, ConversationUncheckedCreateWithoutMessagesInput>
    connectOrCreate?: ConversationCreateOrConnectWithoutMessagesInput
    connect?: ConversationWhereUniqueInput
  }

  export type ConversationUpdateOneRequiredWithoutMessagesNestedInput = {
    create?: XOR<ConversationCreateWithoutMessagesInput, ConversationUncheckedCreateWithoutMessagesInput>
    connectOrCreate?: ConversationCreateOrConnectWithoutMessagesInput
    upsert?: ConversationUpsertWithoutMessagesInput
    connect?: ConversationWhereUniqueInput
    update?: XOR<XOR<ConversationUpdateToOneWithWhereWithoutMessagesInput, ConversationUpdateWithoutMessagesInput>, ConversationUncheckedUpdateWithoutMessagesInput>
  }

  export type ConversationCreateNestedOneWithoutTicketsInput = {
    create?: XOR<ConversationCreateWithoutTicketsInput, ConversationUncheckedCreateWithoutTicketsInput>
    connectOrCreate?: ConversationCreateOrConnectWithoutTicketsInput
    connect?: ConversationWhereUniqueInput
  }

  export type UserCreateNestedOneWithoutAssigned_ticketsInput = {
    create?: XOR<UserCreateWithoutAssigned_ticketsInput, UserUncheckedCreateWithoutAssigned_ticketsInput>
    connectOrCreate?: UserCreateOrConnectWithoutAssigned_ticketsInput
    connect?: UserWhereUniqueInput
  }

  export type CompanyCreateNestedOneWithoutTicketsInput = {
    create?: XOR<CompanyCreateWithoutTicketsInput, CompanyUncheckedCreateWithoutTicketsInput>
    connectOrCreate?: CompanyCreateOrConnectWithoutTicketsInput
    connect?: CompanyWhereUniqueInput
  }

  export type ConversationUpdateOneRequiredWithoutTicketsNestedInput = {
    create?: XOR<ConversationCreateWithoutTicketsInput, ConversationUncheckedCreateWithoutTicketsInput>
    connectOrCreate?: ConversationCreateOrConnectWithoutTicketsInput
    upsert?: ConversationUpsertWithoutTicketsInput
    connect?: ConversationWhereUniqueInput
    update?: XOR<XOR<ConversationUpdateToOneWithWhereWithoutTicketsInput, ConversationUpdateWithoutTicketsInput>, ConversationUncheckedUpdateWithoutTicketsInput>
  }

  export type UserUpdateOneWithoutAssigned_ticketsNestedInput = {
    create?: XOR<UserCreateWithoutAssigned_ticketsInput, UserUncheckedCreateWithoutAssigned_ticketsInput>
    connectOrCreate?: UserCreateOrConnectWithoutAssigned_ticketsInput
    upsert?: UserUpsertWithoutAssigned_ticketsInput
    disconnect?: UserWhereInput | boolean
    delete?: UserWhereInput | boolean
    connect?: UserWhereUniqueInput
    update?: XOR<XOR<UserUpdateToOneWithWhereWithoutAssigned_ticketsInput, UserUpdateWithoutAssigned_ticketsInput>, UserUncheckedUpdateWithoutAssigned_ticketsInput>
  }

  export type CompanyUpdateOneRequiredWithoutTicketsNestedInput = {
    create?: XOR<CompanyCreateWithoutTicketsInput, CompanyUncheckedCreateWithoutTicketsInput>
    connectOrCreate?: CompanyCreateOrConnectWithoutTicketsInput
    upsert?: CompanyUpsertWithoutTicketsInput
    connect?: CompanyWhereUniqueInput
    update?: XOR<XOR<CompanyUpdateToOneWithWhereWithoutTicketsInput, CompanyUpdateWithoutTicketsInput>, CompanyUncheckedUpdateWithoutTicketsInput>
  }

  export type ChannelCreateNestedOneWithoutWebhook_eventsInput = {
    create?: XOR<ChannelCreateWithoutWebhook_eventsInput, ChannelUncheckedCreateWithoutWebhook_eventsInput>
    connectOrCreate?: ChannelCreateOrConnectWithoutWebhook_eventsInput
    connect?: ChannelWhereUniqueInput
  }

  export type ChannelUpdateOneRequiredWithoutWebhook_eventsNestedInput = {
    create?: XOR<ChannelCreateWithoutWebhook_eventsInput, ChannelUncheckedCreateWithoutWebhook_eventsInput>
    connectOrCreate?: ChannelCreateOrConnectWithoutWebhook_eventsInput
    upsert?: ChannelUpsertWithoutWebhook_eventsInput
    connect?: ChannelWhereUniqueInput
    update?: XOR<XOR<ChannelUpdateToOneWithWhereWithoutWebhook_eventsInput, ChannelUpdateWithoutWebhook_eventsInput>, ChannelUncheckedUpdateWithoutWebhook_eventsInput>
  }

  export type NestedUuidFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel>
    in?: string[] | ListStringFieldRefInput<$PrismaModel>
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel>
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    not?: NestedUuidFilter<$PrismaModel> | string
  }

  export type NestedStringFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel>
    in?: string[] | ListStringFieldRefInput<$PrismaModel>
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel>
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    not?: NestedStringFilter<$PrismaModel> | string
  }

  export type NestedDateTimeFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    in?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    notIn?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeFilter<$PrismaModel> | Date | string
  }

  export type NestedUuidWithAggregatesFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel>
    in?: string[] | ListStringFieldRefInput<$PrismaModel>
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel>
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    not?: NestedUuidWithAggregatesFilter<$PrismaModel> | string
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedStringFilter<$PrismaModel>
    _max?: NestedStringFilter<$PrismaModel>
  }

  export type NestedIntFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel>
    in?: number[] | ListIntFieldRefInput<$PrismaModel>
    notIn?: number[] | ListIntFieldRefInput<$PrismaModel>
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntFilter<$PrismaModel> | number
  }

  export type NestedStringWithAggregatesFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel>
    in?: string[] | ListStringFieldRefInput<$PrismaModel>
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel>
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    not?: NestedStringWithAggregatesFilter<$PrismaModel> | string
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedStringFilter<$PrismaModel>
    _max?: NestedStringFilter<$PrismaModel>
  }
  export type NestedJsonFilter<$PrismaModel = never> = 
    | PatchUndefined<
        Either<Required<NestedJsonFilterBase<$PrismaModel>>, Exclude<keyof Required<NestedJsonFilterBase<$PrismaModel>>, 'path'>>,
        Required<NestedJsonFilterBase<$PrismaModel>>
      >
    | OptionalFlat<Omit<Required<NestedJsonFilterBase<$PrismaModel>>, 'path'>>

  export type NestedJsonFilterBase<$PrismaModel = never> = {
    equals?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | JsonNullValueFilter
    path?: string[]
    string_contains?: string | StringFieldRefInput<$PrismaModel>
    string_starts_with?: string | StringFieldRefInput<$PrismaModel>
    string_ends_with?: string | StringFieldRefInput<$PrismaModel>
    array_contains?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    array_starts_with?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    array_ends_with?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    lt?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    lte?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    gt?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    gte?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    not?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | JsonNullValueFilter
  }

  export type NestedDateTimeWithAggregatesFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    in?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    notIn?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeWithAggregatesFilter<$PrismaModel> | Date | string
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedDateTimeFilter<$PrismaModel>
    _max?: NestedDateTimeFilter<$PrismaModel>
  }

  export type NestedBoolFilter<$PrismaModel = never> = {
    equals?: boolean | BooleanFieldRefInput<$PrismaModel>
    not?: NestedBoolFilter<$PrismaModel> | boolean
  }

  export type NestedBoolWithAggregatesFilter<$PrismaModel = never> = {
    equals?: boolean | BooleanFieldRefInput<$PrismaModel>
    not?: NestedBoolWithAggregatesFilter<$PrismaModel> | boolean
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedBoolFilter<$PrismaModel>
    _max?: NestedBoolFilter<$PrismaModel>
  }

  export type NestedStringNullableFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel> | null
    in?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    not?: NestedStringNullableFilter<$PrismaModel> | string | null
  }

  export type NestedStringNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel> | null
    in?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    not?: NestedStringNullableWithAggregatesFilter<$PrismaModel> | string | null
    _count?: NestedIntNullableFilter<$PrismaModel>
    _min?: NestedStringNullableFilter<$PrismaModel>
    _max?: NestedStringNullableFilter<$PrismaModel>
  }

  export type NestedIntNullableFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel> | null
    in?: number[] | ListIntFieldRefInput<$PrismaModel> | null
    notIn?: number[] | ListIntFieldRefInput<$PrismaModel> | null
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntNullableFilter<$PrismaModel> | number | null
  }

  export type NestedUuidNullableFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel> | null
    in?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    not?: NestedUuidNullableFilter<$PrismaModel> | string | null
  }

  export type NestedUuidNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel> | null
    in?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    not?: NestedUuidNullableWithAggregatesFilter<$PrismaModel> | string | null
    _count?: NestedIntNullableFilter<$PrismaModel>
    _min?: NestedStringNullableFilter<$PrismaModel>
    _max?: NestedStringNullableFilter<$PrismaModel>
  }

  export type UserCreateWithoutCompanyInput = {
    id?: string
    email: string
    password_hash: string
    name: string
    role?: string
    is_active?: boolean
    created_at?: Date | string
    updated_at?: Date | string
    assigned_conversations?: ConversationCreateNestedManyWithoutAssigned_userInput
    assigned_tickets?: TicketCreateNestedManyWithoutAssigned_userInput
  }

  export type UserUncheckedCreateWithoutCompanyInput = {
    id?: string
    email: string
    password_hash: string
    name: string
    role?: string
    is_active?: boolean
    created_at?: Date | string
    updated_at?: Date | string
    assigned_conversations?: ConversationUncheckedCreateNestedManyWithoutAssigned_userInput
    assigned_tickets?: TicketUncheckedCreateNestedManyWithoutAssigned_userInput
  }

  export type UserCreateOrConnectWithoutCompanyInput = {
    where: UserWhereUniqueInput
    create: XOR<UserCreateWithoutCompanyInput, UserUncheckedCreateWithoutCompanyInput>
  }

  export type UserCreateManyCompanyInputEnvelope = {
    data: UserCreateManyCompanyInput | UserCreateManyCompanyInput[]
    skipDuplicates?: boolean
  }

  export type ChannelCreateWithoutCompanyInput = {
    id?: string
    name: string
    type: string
    status?: string
    phone_number?: string | null
    instance_id?: string | null
    api_key?: string | null
    webhook_url?: string | null
    settings?: JsonNullValueInput | InputJsonValue
    created_at?: Date | string
    updated_at?: Date | string
    conversations?: ConversationCreateNestedManyWithoutChannelInput
    channel_bots?: ChannelBotCreateNestedManyWithoutChannelInput
    webhook_events?: WebhookEventCreateNestedManyWithoutChannelInput
  }

  export type ChannelUncheckedCreateWithoutCompanyInput = {
    id?: string
    name: string
    type: string
    status?: string
    phone_number?: string | null
    instance_id?: string | null
    api_key?: string | null
    webhook_url?: string | null
    settings?: JsonNullValueInput | InputJsonValue
    created_at?: Date | string
    updated_at?: Date | string
    conversations?: ConversationUncheckedCreateNestedManyWithoutChannelInput
    channel_bots?: ChannelBotUncheckedCreateNestedManyWithoutChannelInput
    webhook_events?: WebhookEventUncheckedCreateNestedManyWithoutChannelInput
  }

  export type ChannelCreateOrConnectWithoutCompanyInput = {
    where: ChannelWhereUniqueInput
    create: XOR<ChannelCreateWithoutCompanyInput, ChannelUncheckedCreateWithoutCompanyInput>
  }

  export type ChannelCreateManyCompanyInputEnvelope = {
    data: ChannelCreateManyCompanyInput | ChannelCreateManyCompanyInput[]
    skipDuplicates?: boolean
  }

  export type BotCreateWithoutCompanyInput = {
    id?: string
    name: string
    description?: string | null
    is_active?: boolean
    flow_data?: JsonNullValueInput | InputJsonValue
    created_at?: Date | string
    updated_at?: Date | string
    conversations?: ConversationCreateNestedManyWithoutBotInput
    channel_bots?: ChannelBotCreateNestedManyWithoutBotInput
  }

  export type BotUncheckedCreateWithoutCompanyInput = {
    id?: string
    name: string
    description?: string | null
    is_active?: boolean
    flow_data?: JsonNullValueInput | InputJsonValue
    created_at?: Date | string
    updated_at?: Date | string
    conversations?: ConversationUncheckedCreateNestedManyWithoutBotInput
    channel_bots?: ChannelBotUncheckedCreateNestedManyWithoutBotInput
  }

  export type BotCreateOrConnectWithoutCompanyInput = {
    where: BotWhereUniqueInput
    create: XOR<BotCreateWithoutCompanyInput, BotUncheckedCreateWithoutCompanyInput>
  }

  export type BotCreateManyCompanyInputEnvelope = {
    data: BotCreateManyCompanyInput | BotCreateManyCompanyInput[]
    skipDuplicates?: boolean
  }

  export type ContactCreateWithoutCompanyInput = {
    id?: string
    name?: string | null
    phone: string
    email?: string | null
    avatar_url?: string | null
    metadata?: JsonNullValueInput | InputJsonValue
    created_at?: Date | string
    updated_at?: Date | string
    conversations?: ConversationCreateNestedManyWithoutContactInput
  }

  export type ContactUncheckedCreateWithoutCompanyInput = {
    id?: string
    name?: string | null
    phone: string
    email?: string | null
    avatar_url?: string | null
    metadata?: JsonNullValueInput | InputJsonValue
    created_at?: Date | string
    updated_at?: Date | string
    conversations?: ConversationUncheckedCreateNestedManyWithoutContactInput
  }

  export type ContactCreateOrConnectWithoutCompanyInput = {
    where: ContactWhereUniqueInput
    create: XOR<ContactCreateWithoutCompanyInput, ContactUncheckedCreateWithoutCompanyInput>
  }

  export type ContactCreateManyCompanyInputEnvelope = {
    data: ContactCreateManyCompanyInput | ContactCreateManyCompanyInput[]
    skipDuplicates?: boolean
  }

  export type ConversationCreateWithoutCompanyInput = {
    id?: string
    status?: string
    last_message_at?: Date | string
    metadata?: JsonNullValueInput | InputJsonValue
    created_at?: Date | string
    updated_at?: Date | string
    contact: ContactCreateNestedOneWithoutConversationsInput
    channel: ChannelCreateNestedOneWithoutConversationsInput
    bot?: BotCreateNestedOneWithoutConversationsInput
    assigned_user?: UserCreateNestedOneWithoutAssigned_conversationsInput
    messages?: MessageCreateNestedManyWithoutConversationInput
    tickets?: TicketCreateNestedManyWithoutConversationInput
  }

  export type ConversationUncheckedCreateWithoutCompanyInput = {
    id?: string
    contact_id: string
    channel_id: string
    bot_id?: string | null
    status?: string
    assigned_to?: string | null
    last_message_at?: Date | string
    metadata?: JsonNullValueInput | InputJsonValue
    created_at?: Date | string
    updated_at?: Date | string
    messages?: MessageUncheckedCreateNestedManyWithoutConversationInput
    tickets?: TicketUncheckedCreateNestedManyWithoutConversationInput
  }

  export type ConversationCreateOrConnectWithoutCompanyInput = {
    where: ConversationWhereUniqueInput
    create: XOR<ConversationCreateWithoutCompanyInput, ConversationUncheckedCreateWithoutCompanyInput>
  }

  export type ConversationCreateManyCompanyInputEnvelope = {
    data: ConversationCreateManyCompanyInput | ConversationCreateManyCompanyInput[]
    skipDuplicates?: boolean
  }

  export type TicketCreateWithoutCompanyInput = {
    id?: string
    ticket_number: string
    title: string
    description?: string | null
    status?: string
    priority?: string
    form_data?: JsonNullValueInput | InputJsonValue
    created_at?: Date | string
    updated_at?: Date | string
    conversation: ConversationCreateNestedOneWithoutTicketsInput
    assigned_user?: UserCreateNestedOneWithoutAssigned_ticketsInput
  }

  export type TicketUncheckedCreateWithoutCompanyInput = {
    id?: string
    ticket_number: string
    conversation_id: string
    title: string
    description?: string | null
    status?: string
    priority?: string
    assigned_to?: string | null
    form_data?: JsonNullValueInput | InputJsonValue
    created_at?: Date | string
    updated_at?: Date | string
  }

  export type TicketCreateOrConnectWithoutCompanyInput = {
    where: TicketWhereUniqueInput
    create: XOR<TicketCreateWithoutCompanyInput, TicketUncheckedCreateWithoutCompanyInput>
  }

  export type TicketCreateManyCompanyInputEnvelope = {
    data: TicketCreateManyCompanyInput | TicketCreateManyCompanyInput[]
    skipDuplicates?: boolean
  }

  export type UserUpsertWithWhereUniqueWithoutCompanyInput = {
    where: UserWhereUniqueInput
    update: XOR<UserUpdateWithoutCompanyInput, UserUncheckedUpdateWithoutCompanyInput>
    create: XOR<UserCreateWithoutCompanyInput, UserUncheckedCreateWithoutCompanyInput>
  }

  export type UserUpdateWithWhereUniqueWithoutCompanyInput = {
    where: UserWhereUniqueInput
    data: XOR<UserUpdateWithoutCompanyInput, UserUncheckedUpdateWithoutCompanyInput>
  }

  export type UserUpdateManyWithWhereWithoutCompanyInput = {
    where: UserScalarWhereInput
    data: XOR<UserUpdateManyMutationInput, UserUncheckedUpdateManyWithoutCompanyInput>
  }

  export type UserScalarWhereInput = {
    AND?: UserScalarWhereInput | UserScalarWhereInput[]
    OR?: UserScalarWhereInput[]
    NOT?: UserScalarWhereInput | UserScalarWhereInput[]
    id?: UuidFilter<"User"> | string
    email?: StringFilter<"User"> | string
    password_hash?: StringFilter<"User"> | string
    name?: StringFilter<"User"> | string
    role?: StringFilter<"User"> | string
    company_id?: UuidFilter<"User"> | string
    is_active?: BoolFilter<"User"> | boolean
    created_at?: DateTimeFilter<"User"> | Date | string
    updated_at?: DateTimeFilter<"User"> | Date | string
  }

  export type ChannelUpsertWithWhereUniqueWithoutCompanyInput = {
    where: ChannelWhereUniqueInput
    update: XOR<ChannelUpdateWithoutCompanyInput, ChannelUncheckedUpdateWithoutCompanyInput>
    create: XOR<ChannelCreateWithoutCompanyInput, ChannelUncheckedCreateWithoutCompanyInput>
  }

  export type ChannelUpdateWithWhereUniqueWithoutCompanyInput = {
    where: ChannelWhereUniqueInput
    data: XOR<ChannelUpdateWithoutCompanyInput, ChannelUncheckedUpdateWithoutCompanyInput>
  }

  export type ChannelUpdateManyWithWhereWithoutCompanyInput = {
    where: ChannelScalarWhereInput
    data: XOR<ChannelUpdateManyMutationInput, ChannelUncheckedUpdateManyWithoutCompanyInput>
  }

  export type ChannelScalarWhereInput = {
    AND?: ChannelScalarWhereInput | ChannelScalarWhereInput[]
    OR?: ChannelScalarWhereInput[]
    NOT?: ChannelScalarWhereInput | ChannelScalarWhereInput[]
    id?: UuidFilter<"Channel"> | string
    name?: StringFilter<"Channel"> | string
    type?: StringFilter<"Channel"> | string
    status?: StringFilter<"Channel"> | string
    phone_number?: StringNullableFilter<"Channel"> | string | null
    instance_id?: StringNullableFilter<"Channel"> | string | null
    api_key?: StringNullableFilter<"Channel"> | string | null
    webhook_url?: StringNullableFilter<"Channel"> | string | null
    settings?: JsonFilter<"Channel">
    company_id?: UuidFilter<"Channel"> | string
    created_at?: DateTimeFilter<"Channel"> | Date | string
    updated_at?: DateTimeFilter<"Channel"> | Date | string
  }

  export type BotUpsertWithWhereUniqueWithoutCompanyInput = {
    where: BotWhereUniqueInput
    update: XOR<BotUpdateWithoutCompanyInput, BotUncheckedUpdateWithoutCompanyInput>
    create: XOR<BotCreateWithoutCompanyInput, BotUncheckedCreateWithoutCompanyInput>
  }

  export type BotUpdateWithWhereUniqueWithoutCompanyInput = {
    where: BotWhereUniqueInput
    data: XOR<BotUpdateWithoutCompanyInput, BotUncheckedUpdateWithoutCompanyInput>
  }

  export type BotUpdateManyWithWhereWithoutCompanyInput = {
    where: BotScalarWhereInput
    data: XOR<BotUpdateManyMutationInput, BotUncheckedUpdateManyWithoutCompanyInput>
  }

  export type BotScalarWhereInput = {
    AND?: BotScalarWhereInput | BotScalarWhereInput[]
    OR?: BotScalarWhereInput[]
    NOT?: BotScalarWhereInput | BotScalarWhereInput[]
    id?: UuidFilter<"Bot"> | string
    name?: StringFilter<"Bot"> | string
    description?: StringNullableFilter<"Bot"> | string | null
    is_active?: BoolFilter<"Bot"> | boolean
    flow_data?: JsonFilter<"Bot">
    company_id?: UuidFilter<"Bot"> | string
    created_at?: DateTimeFilter<"Bot"> | Date | string
    updated_at?: DateTimeFilter<"Bot"> | Date | string
  }

  export type ContactUpsertWithWhereUniqueWithoutCompanyInput = {
    where: ContactWhereUniqueInput
    update: XOR<ContactUpdateWithoutCompanyInput, ContactUncheckedUpdateWithoutCompanyInput>
    create: XOR<ContactCreateWithoutCompanyInput, ContactUncheckedCreateWithoutCompanyInput>
  }

  export type ContactUpdateWithWhereUniqueWithoutCompanyInput = {
    where: ContactWhereUniqueInput
    data: XOR<ContactUpdateWithoutCompanyInput, ContactUncheckedUpdateWithoutCompanyInput>
  }

  export type ContactUpdateManyWithWhereWithoutCompanyInput = {
    where: ContactScalarWhereInput
    data: XOR<ContactUpdateManyMutationInput, ContactUncheckedUpdateManyWithoutCompanyInput>
  }

  export type ContactScalarWhereInput = {
    AND?: ContactScalarWhereInput | ContactScalarWhereInput[]
    OR?: ContactScalarWhereInput[]
    NOT?: ContactScalarWhereInput | ContactScalarWhereInput[]
    id?: UuidFilter<"Contact"> | string
    name?: StringNullableFilter<"Contact"> | string | null
    phone?: StringFilter<"Contact"> | string
    email?: StringNullableFilter<"Contact"> | string | null
    avatar_url?: StringNullableFilter<"Contact"> | string | null
    metadata?: JsonFilter<"Contact">
    company_id?: UuidFilter<"Contact"> | string
    created_at?: DateTimeFilter<"Contact"> | Date | string
    updated_at?: DateTimeFilter<"Contact"> | Date | string
  }

  export type ConversationUpsertWithWhereUniqueWithoutCompanyInput = {
    where: ConversationWhereUniqueInput
    update: XOR<ConversationUpdateWithoutCompanyInput, ConversationUncheckedUpdateWithoutCompanyInput>
    create: XOR<ConversationCreateWithoutCompanyInput, ConversationUncheckedCreateWithoutCompanyInput>
  }

  export type ConversationUpdateWithWhereUniqueWithoutCompanyInput = {
    where: ConversationWhereUniqueInput
    data: XOR<ConversationUpdateWithoutCompanyInput, ConversationUncheckedUpdateWithoutCompanyInput>
  }

  export type ConversationUpdateManyWithWhereWithoutCompanyInput = {
    where: ConversationScalarWhereInput
    data: XOR<ConversationUpdateManyMutationInput, ConversationUncheckedUpdateManyWithoutCompanyInput>
  }

  export type ConversationScalarWhereInput = {
    AND?: ConversationScalarWhereInput | ConversationScalarWhereInput[]
    OR?: ConversationScalarWhereInput[]
    NOT?: ConversationScalarWhereInput | ConversationScalarWhereInput[]
    id?: UuidFilter<"Conversation"> | string
    contact_id?: UuidFilter<"Conversation"> | string
    channel_id?: UuidFilter<"Conversation"> | string
    bot_id?: UuidNullableFilter<"Conversation"> | string | null
    status?: StringFilter<"Conversation"> | string
    assigned_to?: UuidNullableFilter<"Conversation"> | string | null
    last_message_at?: DateTimeFilter<"Conversation"> | Date | string
    company_id?: UuidFilter<"Conversation"> | string
    metadata?: JsonFilter<"Conversation">
    created_at?: DateTimeFilter<"Conversation"> | Date | string
    updated_at?: DateTimeFilter<"Conversation"> | Date | string
  }

  export type TicketUpsertWithWhereUniqueWithoutCompanyInput = {
    where: TicketWhereUniqueInput
    update: XOR<TicketUpdateWithoutCompanyInput, TicketUncheckedUpdateWithoutCompanyInput>
    create: XOR<TicketCreateWithoutCompanyInput, TicketUncheckedCreateWithoutCompanyInput>
  }

  export type TicketUpdateWithWhereUniqueWithoutCompanyInput = {
    where: TicketWhereUniqueInput
    data: XOR<TicketUpdateWithoutCompanyInput, TicketUncheckedUpdateWithoutCompanyInput>
  }

  export type TicketUpdateManyWithWhereWithoutCompanyInput = {
    where: TicketScalarWhereInput
    data: XOR<TicketUpdateManyMutationInput, TicketUncheckedUpdateManyWithoutCompanyInput>
  }

  export type TicketScalarWhereInput = {
    AND?: TicketScalarWhereInput | TicketScalarWhereInput[]
    OR?: TicketScalarWhereInput[]
    NOT?: TicketScalarWhereInput | TicketScalarWhereInput[]
    id?: UuidFilter<"Ticket"> | string
    ticket_number?: StringFilter<"Ticket"> | string
    conversation_id?: UuidFilter<"Ticket"> | string
    title?: StringFilter<"Ticket"> | string
    description?: StringNullableFilter<"Ticket"> | string | null
    status?: StringFilter<"Ticket"> | string
    priority?: StringFilter<"Ticket"> | string
    assigned_to?: UuidNullableFilter<"Ticket"> | string | null
    form_data?: JsonFilter<"Ticket">
    company_id?: UuidFilter<"Ticket"> | string
    created_at?: DateTimeFilter<"Ticket"> | Date | string
    updated_at?: DateTimeFilter<"Ticket"> | Date | string
  }

  export type CompanyCreateWithoutUsersInput = {
    id?: string
    name: string
    slug: string
    settings?: JsonNullValueInput | InputJsonValue
    created_at?: Date | string
    updated_at?: Date | string
    channels?: ChannelCreateNestedManyWithoutCompanyInput
    bots?: BotCreateNestedManyWithoutCompanyInput
    contacts?: ContactCreateNestedManyWithoutCompanyInput
    conversations?: ConversationCreateNestedManyWithoutCompanyInput
    tickets?: TicketCreateNestedManyWithoutCompanyInput
  }

  export type CompanyUncheckedCreateWithoutUsersInput = {
    id?: string
    name: string
    slug: string
    settings?: JsonNullValueInput | InputJsonValue
    created_at?: Date | string
    updated_at?: Date | string
    channels?: ChannelUncheckedCreateNestedManyWithoutCompanyInput
    bots?: BotUncheckedCreateNestedManyWithoutCompanyInput
    contacts?: ContactUncheckedCreateNestedManyWithoutCompanyInput
    conversations?: ConversationUncheckedCreateNestedManyWithoutCompanyInput
    tickets?: TicketUncheckedCreateNestedManyWithoutCompanyInput
  }

  export type CompanyCreateOrConnectWithoutUsersInput = {
    where: CompanyWhereUniqueInput
    create: XOR<CompanyCreateWithoutUsersInput, CompanyUncheckedCreateWithoutUsersInput>
  }

  export type ConversationCreateWithoutAssigned_userInput = {
    id?: string
    status?: string
    last_message_at?: Date | string
    metadata?: JsonNullValueInput | InputJsonValue
    created_at?: Date | string
    updated_at?: Date | string
    contact: ContactCreateNestedOneWithoutConversationsInput
    channel: ChannelCreateNestedOneWithoutConversationsInput
    bot?: BotCreateNestedOneWithoutConversationsInput
    company: CompanyCreateNestedOneWithoutConversationsInput
    messages?: MessageCreateNestedManyWithoutConversationInput
    tickets?: TicketCreateNestedManyWithoutConversationInput
  }

  export type ConversationUncheckedCreateWithoutAssigned_userInput = {
    id?: string
    contact_id: string
    channel_id: string
    bot_id?: string | null
    status?: string
    last_message_at?: Date | string
    company_id: string
    metadata?: JsonNullValueInput | InputJsonValue
    created_at?: Date | string
    updated_at?: Date | string
    messages?: MessageUncheckedCreateNestedManyWithoutConversationInput
    tickets?: TicketUncheckedCreateNestedManyWithoutConversationInput
  }

  export type ConversationCreateOrConnectWithoutAssigned_userInput = {
    where: ConversationWhereUniqueInput
    create: XOR<ConversationCreateWithoutAssigned_userInput, ConversationUncheckedCreateWithoutAssigned_userInput>
  }

  export type ConversationCreateManyAssigned_userInputEnvelope = {
    data: ConversationCreateManyAssigned_userInput | ConversationCreateManyAssigned_userInput[]
    skipDuplicates?: boolean
  }

  export type TicketCreateWithoutAssigned_userInput = {
    id?: string
    ticket_number: string
    title: string
    description?: string | null
    status?: string
    priority?: string
    form_data?: JsonNullValueInput | InputJsonValue
    created_at?: Date | string
    updated_at?: Date | string
    conversation: ConversationCreateNestedOneWithoutTicketsInput
    company: CompanyCreateNestedOneWithoutTicketsInput
  }

  export type TicketUncheckedCreateWithoutAssigned_userInput = {
    id?: string
    ticket_number: string
    conversation_id: string
    title: string
    description?: string | null
    status?: string
    priority?: string
    form_data?: JsonNullValueInput | InputJsonValue
    company_id: string
    created_at?: Date | string
    updated_at?: Date | string
  }

  export type TicketCreateOrConnectWithoutAssigned_userInput = {
    where: TicketWhereUniqueInput
    create: XOR<TicketCreateWithoutAssigned_userInput, TicketUncheckedCreateWithoutAssigned_userInput>
  }

  export type TicketCreateManyAssigned_userInputEnvelope = {
    data: TicketCreateManyAssigned_userInput | TicketCreateManyAssigned_userInput[]
    skipDuplicates?: boolean
  }

  export type CompanyUpsertWithoutUsersInput = {
    update: XOR<CompanyUpdateWithoutUsersInput, CompanyUncheckedUpdateWithoutUsersInput>
    create: XOR<CompanyCreateWithoutUsersInput, CompanyUncheckedCreateWithoutUsersInput>
    where?: CompanyWhereInput
  }

  export type CompanyUpdateToOneWithWhereWithoutUsersInput = {
    where?: CompanyWhereInput
    data: XOR<CompanyUpdateWithoutUsersInput, CompanyUncheckedUpdateWithoutUsersInput>
  }

  export type CompanyUpdateWithoutUsersInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    slug?: StringFieldUpdateOperationsInput | string
    settings?: JsonNullValueInput | InputJsonValue
    created_at?: DateTimeFieldUpdateOperationsInput | Date | string
    updated_at?: DateTimeFieldUpdateOperationsInput | Date | string
    channels?: ChannelUpdateManyWithoutCompanyNestedInput
    bots?: BotUpdateManyWithoutCompanyNestedInput
    contacts?: ContactUpdateManyWithoutCompanyNestedInput
    conversations?: ConversationUpdateManyWithoutCompanyNestedInput
    tickets?: TicketUpdateManyWithoutCompanyNestedInput
  }

  export type CompanyUncheckedUpdateWithoutUsersInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    slug?: StringFieldUpdateOperationsInput | string
    settings?: JsonNullValueInput | InputJsonValue
    created_at?: DateTimeFieldUpdateOperationsInput | Date | string
    updated_at?: DateTimeFieldUpdateOperationsInput | Date | string
    channels?: ChannelUncheckedUpdateManyWithoutCompanyNestedInput
    bots?: BotUncheckedUpdateManyWithoutCompanyNestedInput
    contacts?: ContactUncheckedUpdateManyWithoutCompanyNestedInput
    conversations?: ConversationUncheckedUpdateManyWithoutCompanyNestedInput
    tickets?: TicketUncheckedUpdateManyWithoutCompanyNestedInput
  }

  export type ConversationUpsertWithWhereUniqueWithoutAssigned_userInput = {
    where: ConversationWhereUniqueInput
    update: XOR<ConversationUpdateWithoutAssigned_userInput, ConversationUncheckedUpdateWithoutAssigned_userInput>
    create: XOR<ConversationCreateWithoutAssigned_userInput, ConversationUncheckedCreateWithoutAssigned_userInput>
  }

  export type ConversationUpdateWithWhereUniqueWithoutAssigned_userInput = {
    where: ConversationWhereUniqueInput
    data: XOR<ConversationUpdateWithoutAssigned_userInput, ConversationUncheckedUpdateWithoutAssigned_userInput>
  }

  export type ConversationUpdateManyWithWhereWithoutAssigned_userInput = {
    where: ConversationScalarWhereInput
    data: XOR<ConversationUpdateManyMutationInput, ConversationUncheckedUpdateManyWithoutAssigned_userInput>
  }

  export type TicketUpsertWithWhereUniqueWithoutAssigned_userInput = {
    where: TicketWhereUniqueInput
    update: XOR<TicketUpdateWithoutAssigned_userInput, TicketUncheckedUpdateWithoutAssigned_userInput>
    create: XOR<TicketCreateWithoutAssigned_userInput, TicketUncheckedCreateWithoutAssigned_userInput>
  }

  export type TicketUpdateWithWhereUniqueWithoutAssigned_userInput = {
    where: TicketWhereUniqueInput
    data: XOR<TicketUpdateWithoutAssigned_userInput, TicketUncheckedUpdateWithoutAssigned_userInput>
  }

  export type TicketUpdateManyWithWhereWithoutAssigned_userInput = {
    where: TicketScalarWhereInput
    data: XOR<TicketUpdateManyMutationInput, TicketUncheckedUpdateManyWithoutAssigned_userInput>
  }

  export type CompanyCreateWithoutChannelsInput = {
    id?: string
    name: string
    slug: string
    settings?: JsonNullValueInput | InputJsonValue
    created_at?: Date | string
    updated_at?: Date | string
    users?: UserCreateNestedManyWithoutCompanyInput
    bots?: BotCreateNestedManyWithoutCompanyInput
    contacts?: ContactCreateNestedManyWithoutCompanyInput
    conversations?: ConversationCreateNestedManyWithoutCompanyInput
    tickets?: TicketCreateNestedManyWithoutCompanyInput
  }

  export type CompanyUncheckedCreateWithoutChannelsInput = {
    id?: string
    name: string
    slug: string
    settings?: JsonNullValueInput | InputJsonValue
    created_at?: Date | string
    updated_at?: Date | string
    users?: UserUncheckedCreateNestedManyWithoutCompanyInput
    bots?: BotUncheckedCreateNestedManyWithoutCompanyInput
    contacts?: ContactUncheckedCreateNestedManyWithoutCompanyInput
    conversations?: ConversationUncheckedCreateNestedManyWithoutCompanyInput
    tickets?: TicketUncheckedCreateNestedManyWithoutCompanyInput
  }

  export type CompanyCreateOrConnectWithoutChannelsInput = {
    where: CompanyWhereUniqueInput
    create: XOR<CompanyCreateWithoutChannelsInput, CompanyUncheckedCreateWithoutChannelsInput>
  }

  export type ConversationCreateWithoutChannelInput = {
    id?: string
    status?: string
    last_message_at?: Date | string
    metadata?: JsonNullValueInput | InputJsonValue
    created_at?: Date | string
    updated_at?: Date | string
    contact: ContactCreateNestedOneWithoutConversationsInput
    bot?: BotCreateNestedOneWithoutConversationsInput
    assigned_user?: UserCreateNestedOneWithoutAssigned_conversationsInput
    company: CompanyCreateNestedOneWithoutConversationsInput
    messages?: MessageCreateNestedManyWithoutConversationInput
    tickets?: TicketCreateNestedManyWithoutConversationInput
  }

  export type ConversationUncheckedCreateWithoutChannelInput = {
    id?: string
    contact_id: string
    bot_id?: string | null
    status?: string
    assigned_to?: string | null
    last_message_at?: Date | string
    company_id: string
    metadata?: JsonNullValueInput | InputJsonValue
    created_at?: Date | string
    updated_at?: Date | string
    messages?: MessageUncheckedCreateNestedManyWithoutConversationInput
    tickets?: TicketUncheckedCreateNestedManyWithoutConversationInput
  }

  export type ConversationCreateOrConnectWithoutChannelInput = {
    where: ConversationWhereUniqueInput
    create: XOR<ConversationCreateWithoutChannelInput, ConversationUncheckedCreateWithoutChannelInput>
  }

  export type ConversationCreateManyChannelInputEnvelope = {
    data: ConversationCreateManyChannelInput | ConversationCreateManyChannelInput[]
    skipDuplicates?: boolean
  }

  export type ChannelBotCreateWithoutChannelInput = {
    id?: string
    is_active?: boolean
    trigger_conditions?: JsonNullValueInput | InputJsonValue
    created_at?: Date | string
    bot: BotCreateNestedOneWithoutChannel_botsInput
  }

  export type ChannelBotUncheckedCreateWithoutChannelInput = {
    id?: string
    bot_id: string
    is_active?: boolean
    trigger_conditions?: JsonNullValueInput | InputJsonValue
    created_at?: Date | string
  }

  export type ChannelBotCreateOrConnectWithoutChannelInput = {
    where: ChannelBotWhereUniqueInput
    create: XOR<ChannelBotCreateWithoutChannelInput, ChannelBotUncheckedCreateWithoutChannelInput>
  }

  export type ChannelBotCreateManyChannelInputEnvelope = {
    data: ChannelBotCreateManyChannelInput | ChannelBotCreateManyChannelInput[]
    skipDuplicates?: boolean
  }

  export type WebhookEventCreateWithoutChannelInput = {
    id?: string
    event_type: string
    payload?: JsonNullValueInput | InputJsonValue
    processed?: boolean
    processing_error?: string | null
    created_at?: Date | string
  }

  export type WebhookEventUncheckedCreateWithoutChannelInput = {
    id?: string
    event_type: string
    payload?: JsonNullValueInput | InputJsonValue
    processed?: boolean
    processing_error?: string | null
    created_at?: Date | string
  }

  export type WebhookEventCreateOrConnectWithoutChannelInput = {
    where: WebhookEventWhereUniqueInput
    create: XOR<WebhookEventCreateWithoutChannelInput, WebhookEventUncheckedCreateWithoutChannelInput>
  }

  export type WebhookEventCreateManyChannelInputEnvelope = {
    data: WebhookEventCreateManyChannelInput | WebhookEventCreateManyChannelInput[]
    skipDuplicates?: boolean
  }

  export type CompanyUpsertWithoutChannelsInput = {
    update: XOR<CompanyUpdateWithoutChannelsInput, CompanyUncheckedUpdateWithoutChannelsInput>
    create: XOR<CompanyCreateWithoutChannelsInput, CompanyUncheckedCreateWithoutChannelsInput>
    where?: CompanyWhereInput
  }

  export type CompanyUpdateToOneWithWhereWithoutChannelsInput = {
    where?: CompanyWhereInput
    data: XOR<CompanyUpdateWithoutChannelsInput, CompanyUncheckedUpdateWithoutChannelsInput>
  }

  export type CompanyUpdateWithoutChannelsInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    slug?: StringFieldUpdateOperationsInput | string
    settings?: JsonNullValueInput | InputJsonValue
    created_at?: DateTimeFieldUpdateOperationsInput | Date | string
    updated_at?: DateTimeFieldUpdateOperationsInput | Date | string
    users?: UserUpdateManyWithoutCompanyNestedInput
    bots?: BotUpdateManyWithoutCompanyNestedInput
    contacts?: ContactUpdateManyWithoutCompanyNestedInput
    conversations?: ConversationUpdateManyWithoutCompanyNestedInput
    tickets?: TicketUpdateManyWithoutCompanyNestedInput
  }

  export type CompanyUncheckedUpdateWithoutChannelsInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    slug?: StringFieldUpdateOperationsInput | string
    settings?: JsonNullValueInput | InputJsonValue
    created_at?: DateTimeFieldUpdateOperationsInput | Date | string
    updated_at?: DateTimeFieldUpdateOperationsInput | Date | string
    users?: UserUncheckedUpdateManyWithoutCompanyNestedInput
    bots?: BotUncheckedUpdateManyWithoutCompanyNestedInput
    contacts?: ContactUncheckedUpdateManyWithoutCompanyNestedInput
    conversations?: ConversationUncheckedUpdateManyWithoutCompanyNestedInput
    tickets?: TicketUncheckedUpdateManyWithoutCompanyNestedInput
  }

  export type ConversationUpsertWithWhereUniqueWithoutChannelInput = {
    where: ConversationWhereUniqueInput
    update: XOR<ConversationUpdateWithoutChannelInput, ConversationUncheckedUpdateWithoutChannelInput>
    create: XOR<ConversationCreateWithoutChannelInput, ConversationUncheckedCreateWithoutChannelInput>
  }

  export type ConversationUpdateWithWhereUniqueWithoutChannelInput = {
    where: ConversationWhereUniqueInput
    data: XOR<ConversationUpdateWithoutChannelInput, ConversationUncheckedUpdateWithoutChannelInput>
  }

  export type ConversationUpdateManyWithWhereWithoutChannelInput = {
    where: ConversationScalarWhereInput
    data: XOR<ConversationUpdateManyMutationInput, ConversationUncheckedUpdateManyWithoutChannelInput>
  }

  export type ChannelBotUpsertWithWhereUniqueWithoutChannelInput = {
    where: ChannelBotWhereUniqueInput
    update: XOR<ChannelBotUpdateWithoutChannelInput, ChannelBotUncheckedUpdateWithoutChannelInput>
    create: XOR<ChannelBotCreateWithoutChannelInput, ChannelBotUncheckedCreateWithoutChannelInput>
  }

  export type ChannelBotUpdateWithWhereUniqueWithoutChannelInput = {
    where: ChannelBotWhereUniqueInput
    data: XOR<ChannelBotUpdateWithoutChannelInput, ChannelBotUncheckedUpdateWithoutChannelInput>
  }

  export type ChannelBotUpdateManyWithWhereWithoutChannelInput = {
    where: ChannelBotScalarWhereInput
    data: XOR<ChannelBotUpdateManyMutationInput, ChannelBotUncheckedUpdateManyWithoutChannelInput>
  }

  export type ChannelBotScalarWhereInput = {
    AND?: ChannelBotScalarWhereInput | ChannelBotScalarWhereInput[]
    OR?: ChannelBotScalarWhereInput[]
    NOT?: ChannelBotScalarWhereInput | ChannelBotScalarWhereInput[]
    id?: UuidFilter<"ChannelBot"> | string
    channel_id?: UuidFilter<"ChannelBot"> | string
    bot_id?: UuidFilter<"ChannelBot"> | string
    is_active?: BoolFilter<"ChannelBot"> | boolean
    trigger_conditions?: JsonFilter<"ChannelBot">
    created_at?: DateTimeFilter<"ChannelBot"> | Date | string
  }

  export type WebhookEventUpsertWithWhereUniqueWithoutChannelInput = {
    where: WebhookEventWhereUniqueInput
    update: XOR<WebhookEventUpdateWithoutChannelInput, WebhookEventUncheckedUpdateWithoutChannelInput>
    create: XOR<WebhookEventCreateWithoutChannelInput, WebhookEventUncheckedCreateWithoutChannelInput>
  }

  export type WebhookEventUpdateWithWhereUniqueWithoutChannelInput = {
    where: WebhookEventWhereUniqueInput
    data: XOR<WebhookEventUpdateWithoutChannelInput, WebhookEventUncheckedUpdateWithoutChannelInput>
  }

  export type WebhookEventUpdateManyWithWhereWithoutChannelInput = {
    where: WebhookEventScalarWhereInput
    data: XOR<WebhookEventUpdateManyMutationInput, WebhookEventUncheckedUpdateManyWithoutChannelInput>
  }

  export type WebhookEventScalarWhereInput = {
    AND?: WebhookEventScalarWhereInput | WebhookEventScalarWhereInput[]
    OR?: WebhookEventScalarWhereInput[]
    NOT?: WebhookEventScalarWhereInput | WebhookEventScalarWhereInput[]
    id?: UuidFilter<"WebhookEvent"> | string
    channel_id?: UuidFilter<"WebhookEvent"> | string
    event_type?: StringFilter<"WebhookEvent"> | string
    payload?: JsonFilter<"WebhookEvent">
    processed?: BoolFilter<"WebhookEvent"> | boolean
    processing_error?: StringNullableFilter<"WebhookEvent"> | string | null
    created_at?: DateTimeFilter<"WebhookEvent"> | Date | string
  }

  export type CompanyCreateWithoutBotsInput = {
    id?: string
    name: string
    slug: string
    settings?: JsonNullValueInput | InputJsonValue
    created_at?: Date | string
    updated_at?: Date | string
    users?: UserCreateNestedManyWithoutCompanyInput
    channels?: ChannelCreateNestedManyWithoutCompanyInput
    contacts?: ContactCreateNestedManyWithoutCompanyInput
    conversations?: ConversationCreateNestedManyWithoutCompanyInput
    tickets?: TicketCreateNestedManyWithoutCompanyInput
  }

  export type CompanyUncheckedCreateWithoutBotsInput = {
    id?: string
    name: string
    slug: string
    settings?: JsonNullValueInput | InputJsonValue
    created_at?: Date | string
    updated_at?: Date | string
    users?: UserUncheckedCreateNestedManyWithoutCompanyInput
    channels?: ChannelUncheckedCreateNestedManyWithoutCompanyInput
    contacts?: ContactUncheckedCreateNestedManyWithoutCompanyInput
    conversations?: ConversationUncheckedCreateNestedManyWithoutCompanyInput
    tickets?: TicketUncheckedCreateNestedManyWithoutCompanyInput
  }

  export type CompanyCreateOrConnectWithoutBotsInput = {
    where: CompanyWhereUniqueInput
    create: XOR<CompanyCreateWithoutBotsInput, CompanyUncheckedCreateWithoutBotsInput>
  }

  export type ConversationCreateWithoutBotInput = {
    id?: string
    status?: string
    last_message_at?: Date | string
    metadata?: JsonNullValueInput | InputJsonValue
    created_at?: Date | string
    updated_at?: Date | string
    contact: ContactCreateNestedOneWithoutConversationsInput
    channel: ChannelCreateNestedOneWithoutConversationsInput
    assigned_user?: UserCreateNestedOneWithoutAssigned_conversationsInput
    company: CompanyCreateNestedOneWithoutConversationsInput
    messages?: MessageCreateNestedManyWithoutConversationInput
    tickets?: TicketCreateNestedManyWithoutConversationInput
  }

  export type ConversationUncheckedCreateWithoutBotInput = {
    id?: string
    contact_id: string
    channel_id: string
    status?: string
    assigned_to?: string | null
    last_message_at?: Date | string
    company_id: string
    metadata?: JsonNullValueInput | InputJsonValue
    created_at?: Date | string
    updated_at?: Date | string
    messages?: MessageUncheckedCreateNestedManyWithoutConversationInput
    tickets?: TicketUncheckedCreateNestedManyWithoutConversationInput
  }

  export type ConversationCreateOrConnectWithoutBotInput = {
    where: ConversationWhereUniqueInput
    create: XOR<ConversationCreateWithoutBotInput, ConversationUncheckedCreateWithoutBotInput>
  }

  export type ConversationCreateManyBotInputEnvelope = {
    data: ConversationCreateManyBotInput | ConversationCreateManyBotInput[]
    skipDuplicates?: boolean
  }

  export type ChannelBotCreateWithoutBotInput = {
    id?: string
    is_active?: boolean
    trigger_conditions?: JsonNullValueInput | InputJsonValue
    created_at?: Date | string
    channel: ChannelCreateNestedOneWithoutChannel_botsInput
  }

  export type ChannelBotUncheckedCreateWithoutBotInput = {
    id?: string
    channel_id: string
    is_active?: boolean
    trigger_conditions?: JsonNullValueInput | InputJsonValue
    created_at?: Date | string
  }

  export type ChannelBotCreateOrConnectWithoutBotInput = {
    where: ChannelBotWhereUniqueInput
    create: XOR<ChannelBotCreateWithoutBotInput, ChannelBotUncheckedCreateWithoutBotInput>
  }

  export type ChannelBotCreateManyBotInputEnvelope = {
    data: ChannelBotCreateManyBotInput | ChannelBotCreateManyBotInput[]
    skipDuplicates?: boolean
  }

  export type CompanyUpsertWithoutBotsInput = {
    update: XOR<CompanyUpdateWithoutBotsInput, CompanyUncheckedUpdateWithoutBotsInput>
    create: XOR<CompanyCreateWithoutBotsInput, CompanyUncheckedCreateWithoutBotsInput>
    where?: CompanyWhereInput
  }

  export type CompanyUpdateToOneWithWhereWithoutBotsInput = {
    where?: CompanyWhereInput
    data: XOR<CompanyUpdateWithoutBotsInput, CompanyUncheckedUpdateWithoutBotsInput>
  }

  export type CompanyUpdateWithoutBotsInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    slug?: StringFieldUpdateOperationsInput | string
    settings?: JsonNullValueInput | InputJsonValue
    created_at?: DateTimeFieldUpdateOperationsInput | Date | string
    updated_at?: DateTimeFieldUpdateOperationsInput | Date | string
    users?: UserUpdateManyWithoutCompanyNestedInput
    channels?: ChannelUpdateManyWithoutCompanyNestedInput
    contacts?: ContactUpdateManyWithoutCompanyNestedInput
    conversations?: ConversationUpdateManyWithoutCompanyNestedInput
    tickets?: TicketUpdateManyWithoutCompanyNestedInput
  }

  export type CompanyUncheckedUpdateWithoutBotsInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    slug?: StringFieldUpdateOperationsInput | string
    settings?: JsonNullValueInput | InputJsonValue
    created_at?: DateTimeFieldUpdateOperationsInput | Date | string
    updated_at?: DateTimeFieldUpdateOperationsInput | Date | string
    users?: UserUncheckedUpdateManyWithoutCompanyNestedInput
    channels?: ChannelUncheckedUpdateManyWithoutCompanyNestedInput
    contacts?: ContactUncheckedUpdateManyWithoutCompanyNestedInput
    conversations?: ConversationUncheckedUpdateManyWithoutCompanyNestedInput
    tickets?: TicketUncheckedUpdateManyWithoutCompanyNestedInput
  }

  export type ConversationUpsertWithWhereUniqueWithoutBotInput = {
    where: ConversationWhereUniqueInput
    update: XOR<ConversationUpdateWithoutBotInput, ConversationUncheckedUpdateWithoutBotInput>
    create: XOR<ConversationCreateWithoutBotInput, ConversationUncheckedCreateWithoutBotInput>
  }

  export type ConversationUpdateWithWhereUniqueWithoutBotInput = {
    where: ConversationWhereUniqueInput
    data: XOR<ConversationUpdateWithoutBotInput, ConversationUncheckedUpdateWithoutBotInput>
  }

  export type ConversationUpdateManyWithWhereWithoutBotInput = {
    where: ConversationScalarWhereInput
    data: XOR<ConversationUpdateManyMutationInput, ConversationUncheckedUpdateManyWithoutBotInput>
  }

  export type ChannelBotUpsertWithWhereUniqueWithoutBotInput = {
    where: ChannelBotWhereUniqueInput
    update: XOR<ChannelBotUpdateWithoutBotInput, ChannelBotUncheckedUpdateWithoutBotInput>
    create: XOR<ChannelBotCreateWithoutBotInput, ChannelBotUncheckedCreateWithoutBotInput>
  }

  export type ChannelBotUpdateWithWhereUniqueWithoutBotInput = {
    where: ChannelBotWhereUniqueInput
    data: XOR<ChannelBotUpdateWithoutBotInput, ChannelBotUncheckedUpdateWithoutBotInput>
  }

  export type ChannelBotUpdateManyWithWhereWithoutBotInput = {
    where: ChannelBotScalarWhereInput
    data: XOR<ChannelBotUpdateManyMutationInput, ChannelBotUncheckedUpdateManyWithoutBotInput>
  }

  export type ChannelCreateWithoutChannel_botsInput = {
    id?: string
    name: string
    type: string
    status?: string
    phone_number?: string | null
    instance_id?: string | null
    api_key?: string | null
    webhook_url?: string | null
    settings?: JsonNullValueInput | InputJsonValue
    created_at?: Date | string
    updated_at?: Date | string
    company: CompanyCreateNestedOneWithoutChannelsInput
    conversations?: ConversationCreateNestedManyWithoutChannelInput
    webhook_events?: WebhookEventCreateNestedManyWithoutChannelInput
  }

  export type ChannelUncheckedCreateWithoutChannel_botsInput = {
    id?: string
    name: string
    type: string
    status?: string
    phone_number?: string | null
    instance_id?: string | null
    api_key?: string | null
    webhook_url?: string | null
    settings?: JsonNullValueInput | InputJsonValue
    company_id: string
    created_at?: Date | string
    updated_at?: Date | string
    conversations?: ConversationUncheckedCreateNestedManyWithoutChannelInput
    webhook_events?: WebhookEventUncheckedCreateNestedManyWithoutChannelInput
  }

  export type ChannelCreateOrConnectWithoutChannel_botsInput = {
    where: ChannelWhereUniqueInput
    create: XOR<ChannelCreateWithoutChannel_botsInput, ChannelUncheckedCreateWithoutChannel_botsInput>
  }

  export type BotCreateWithoutChannel_botsInput = {
    id?: string
    name: string
    description?: string | null
    is_active?: boolean
    flow_data?: JsonNullValueInput | InputJsonValue
    created_at?: Date | string
    updated_at?: Date | string
    company: CompanyCreateNestedOneWithoutBotsInput
    conversations?: ConversationCreateNestedManyWithoutBotInput
  }

  export type BotUncheckedCreateWithoutChannel_botsInput = {
    id?: string
    name: string
    description?: string | null
    is_active?: boolean
    flow_data?: JsonNullValueInput | InputJsonValue
    company_id: string
    created_at?: Date | string
    updated_at?: Date | string
    conversations?: ConversationUncheckedCreateNestedManyWithoutBotInput
  }

  export type BotCreateOrConnectWithoutChannel_botsInput = {
    where: BotWhereUniqueInput
    create: XOR<BotCreateWithoutChannel_botsInput, BotUncheckedCreateWithoutChannel_botsInput>
  }

  export type ChannelUpsertWithoutChannel_botsInput = {
    update: XOR<ChannelUpdateWithoutChannel_botsInput, ChannelUncheckedUpdateWithoutChannel_botsInput>
    create: XOR<ChannelCreateWithoutChannel_botsInput, ChannelUncheckedCreateWithoutChannel_botsInput>
    where?: ChannelWhereInput
  }

  export type ChannelUpdateToOneWithWhereWithoutChannel_botsInput = {
    where?: ChannelWhereInput
    data: XOR<ChannelUpdateWithoutChannel_botsInput, ChannelUncheckedUpdateWithoutChannel_botsInput>
  }

  export type ChannelUpdateWithoutChannel_botsInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    type?: StringFieldUpdateOperationsInput | string
    status?: StringFieldUpdateOperationsInput | string
    phone_number?: NullableStringFieldUpdateOperationsInput | string | null
    instance_id?: NullableStringFieldUpdateOperationsInput | string | null
    api_key?: NullableStringFieldUpdateOperationsInput | string | null
    webhook_url?: NullableStringFieldUpdateOperationsInput | string | null
    settings?: JsonNullValueInput | InputJsonValue
    created_at?: DateTimeFieldUpdateOperationsInput | Date | string
    updated_at?: DateTimeFieldUpdateOperationsInput | Date | string
    company?: CompanyUpdateOneRequiredWithoutChannelsNestedInput
    conversations?: ConversationUpdateManyWithoutChannelNestedInput
    webhook_events?: WebhookEventUpdateManyWithoutChannelNestedInput
  }

  export type ChannelUncheckedUpdateWithoutChannel_botsInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    type?: StringFieldUpdateOperationsInput | string
    status?: StringFieldUpdateOperationsInput | string
    phone_number?: NullableStringFieldUpdateOperationsInput | string | null
    instance_id?: NullableStringFieldUpdateOperationsInput | string | null
    api_key?: NullableStringFieldUpdateOperationsInput | string | null
    webhook_url?: NullableStringFieldUpdateOperationsInput | string | null
    settings?: JsonNullValueInput | InputJsonValue
    company_id?: StringFieldUpdateOperationsInput | string
    created_at?: DateTimeFieldUpdateOperationsInput | Date | string
    updated_at?: DateTimeFieldUpdateOperationsInput | Date | string
    conversations?: ConversationUncheckedUpdateManyWithoutChannelNestedInput
    webhook_events?: WebhookEventUncheckedUpdateManyWithoutChannelNestedInput
  }

  export type BotUpsertWithoutChannel_botsInput = {
    update: XOR<BotUpdateWithoutChannel_botsInput, BotUncheckedUpdateWithoutChannel_botsInput>
    create: XOR<BotCreateWithoutChannel_botsInput, BotUncheckedCreateWithoutChannel_botsInput>
    where?: BotWhereInput
  }

  export type BotUpdateToOneWithWhereWithoutChannel_botsInput = {
    where?: BotWhereInput
    data: XOR<BotUpdateWithoutChannel_botsInput, BotUncheckedUpdateWithoutChannel_botsInput>
  }

  export type BotUpdateWithoutChannel_botsInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    description?: NullableStringFieldUpdateOperationsInput | string | null
    is_active?: BoolFieldUpdateOperationsInput | boolean
    flow_data?: JsonNullValueInput | InputJsonValue
    created_at?: DateTimeFieldUpdateOperationsInput | Date | string
    updated_at?: DateTimeFieldUpdateOperationsInput | Date | string
    company?: CompanyUpdateOneRequiredWithoutBotsNestedInput
    conversations?: ConversationUpdateManyWithoutBotNestedInput
  }

  export type BotUncheckedUpdateWithoutChannel_botsInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    description?: NullableStringFieldUpdateOperationsInput | string | null
    is_active?: BoolFieldUpdateOperationsInput | boolean
    flow_data?: JsonNullValueInput | InputJsonValue
    company_id?: StringFieldUpdateOperationsInput | string
    created_at?: DateTimeFieldUpdateOperationsInput | Date | string
    updated_at?: DateTimeFieldUpdateOperationsInput | Date | string
    conversations?: ConversationUncheckedUpdateManyWithoutBotNestedInput
  }

  export type CompanyCreateWithoutContactsInput = {
    id?: string
    name: string
    slug: string
    settings?: JsonNullValueInput | InputJsonValue
    created_at?: Date | string
    updated_at?: Date | string
    users?: UserCreateNestedManyWithoutCompanyInput
    channels?: ChannelCreateNestedManyWithoutCompanyInput
    bots?: BotCreateNestedManyWithoutCompanyInput
    conversations?: ConversationCreateNestedManyWithoutCompanyInput
    tickets?: TicketCreateNestedManyWithoutCompanyInput
  }

  export type CompanyUncheckedCreateWithoutContactsInput = {
    id?: string
    name: string
    slug: string
    settings?: JsonNullValueInput | InputJsonValue
    created_at?: Date | string
    updated_at?: Date | string
    users?: UserUncheckedCreateNestedManyWithoutCompanyInput
    channels?: ChannelUncheckedCreateNestedManyWithoutCompanyInput
    bots?: BotUncheckedCreateNestedManyWithoutCompanyInput
    conversations?: ConversationUncheckedCreateNestedManyWithoutCompanyInput
    tickets?: TicketUncheckedCreateNestedManyWithoutCompanyInput
  }

  export type CompanyCreateOrConnectWithoutContactsInput = {
    where: CompanyWhereUniqueInput
    create: XOR<CompanyCreateWithoutContactsInput, CompanyUncheckedCreateWithoutContactsInput>
  }

  export type ConversationCreateWithoutContactInput = {
    id?: string
    status?: string
    last_message_at?: Date | string
    metadata?: JsonNullValueInput | InputJsonValue
    created_at?: Date | string
    updated_at?: Date | string
    channel: ChannelCreateNestedOneWithoutConversationsInput
    bot?: BotCreateNestedOneWithoutConversationsInput
    assigned_user?: UserCreateNestedOneWithoutAssigned_conversationsInput
    company: CompanyCreateNestedOneWithoutConversationsInput
    messages?: MessageCreateNestedManyWithoutConversationInput
    tickets?: TicketCreateNestedManyWithoutConversationInput
  }

  export type ConversationUncheckedCreateWithoutContactInput = {
    id?: string
    channel_id: string
    bot_id?: string | null
    status?: string
    assigned_to?: string | null
    last_message_at?: Date | string
    company_id: string
    metadata?: JsonNullValueInput | InputJsonValue
    created_at?: Date | string
    updated_at?: Date | string
    messages?: MessageUncheckedCreateNestedManyWithoutConversationInput
    tickets?: TicketUncheckedCreateNestedManyWithoutConversationInput
  }

  export type ConversationCreateOrConnectWithoutContactInput = {
    where: ConversationWhereUniqueInput
    create: XOR<ConversationCreateWithoutContactInput, ConversationUncheckedCreateWithoutContactInput>
  }

  export type ConversationCreateManyContactInputEnvelope = {
    data: ConversationCreateManyContactInput | ConversationCreateManyContactInput[]
    skipDuplicates?: boolean
  }

  export type CompanyUpsertWithoutContactsInput = {
    update: XOR<CompanyUpdateWithoutContactsInput, CompanyUncheckedUpdateWithoutContactsInput>
    create: XOR<CompanyCreateWithoutContactsInput, CompanyUncheckedCreateWithoutContactsInput>
    where?: CompanyWhereInput
  }

  export type CompanyUpdateToOneWithWhereWithoutContactsInput = {
    where?: CompanyWhereInput
    data: XOR<CompanyUpdateWithoutContactsInput, CompanyUncheckedUpdateWithoutContactsInput>
  }

  export type CompanyUpdateWithoutContactsInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    slug?: StringFieldUpdateOperationsInput | string
    settings?: JsonNullValueInput | InputJsonValue
    created_at?: DateTimeFieldUpdateOperationsInput | Date | string
    updated_at?: DateTimeFieldUpdateOperationsInput | Date | string
    users?: UserUpdateManyWithoutCompanyNestedInput
    channels?: ChannelUpdateManyWithoutCompanyNestedInput
    bots?: BotUpdateManyWithoutCompanyNestedInput
    conversations?: ConversationUpdateManyWithoutCompanyNestedInput
    tickets?: TicketUpdateManyWithoutCompanyNestedInput
  }

  export type CompanyUncheckedUpdateWithoutContactsInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    slug?: StringFieldUpdateOperationsInput | string
    settings?: JsonNullValueInput | InputJsonValue
    created_at?: DateTimeFieldUpdateOperationsInput | Date | string
    updated_at?: DateTimeFieldUpdateOperationsInput | Date | string
    users?: UserUncheckedUpdateManyWithoutCompanyNestedInput
    channels?: ChannelUncheckedUpdateManyWithoutCompanyNestedInput
    bots?: BotUncheckedUpdateManyWithoutCompanyNestedInput
    conversations?: ConversationUncheckedUpdateManyWithoutCompanyNestedInput
    tickets?: TicketUncheckedUpdateManyWithoutCompanyNestedInput
  }

  export type ConversationUpsertWithWhereUniqueWithoutContactInput = {
    where: ConversationWhereUniqueInput
    update: XOR<ConversationUpdateWithoutContactInput, ConversationUncheckedUpdateWithoutContactInput>
    create: XOR<ConversationCreateWithoutContactInput, ConversationUncheckedCreateWithoutContactInput>
  }

  export type ConversationUpdateWithWhereUniqueWithoutContactInput = {
    where: ConversationWhereUniqueInput
    data: XOR<ConversationUpdateWithoutContactInput, ConversationUncheckedUpdateWithoutContactInput>
  }

  export type ConversationUpdateManyWithWhereWithoutContactInput = {
    where: ConversationScalarWhereInput
    data: XOR<ConversationUpdateManyMutationInput, ConversationUncheckedUpdateManyWithoutContactInput>
  }

  export type ContactCreateWithoutConversationsInput = {
    id?: string
    name?: string | null
    phone: string
    email?: string | null
    avatar_url?: string | null
    metadata?: JsonNullValueInput | InputJsonValue
    created_at?: Date | string
    updated_at?: Date | string
    company: CompanyCreateNestedOneWithoutContactsInput
  }

  export type ContactUncheckedCreateWithoutConversationsInput = {
    id?: string
    name?: string | null
    phone: string
    email?: string | null
    avatar_url?: string | null
    metadata?: JsonNullValueInput | InputJsonValue
    company_id: string
    created_at?: Date | string
    updated_at?: Date | string
  }

  export type ContactCreateOrConnectWithoutConversationsInput = {
    where: ContactWhereUniqueInput
    create: XOR<ContactCreateWithoutConversationsInput, ContactUncheckedCreateWithoutConversationsInput>
  }

  export type ChannelCreateWithoutConversationsInput = {
    id?: string
    name: string
    type: string
    status?: string
    phone_number?: string | null
    instance_id?: string | null
    api_key?: string | null
    webhook_url?: string | null
    settings?: JsonNullValueInput | InputJsonValue
    created_at?: Date | string
    updated_at?: Date | string
    company: CompanyCreateNestedOneWithoutChannelsInput
    channel_bots?: ChannelBotCreateNestedManyWithoutChannelInput
    webhook_events?: WebhookEventCreateNestedManyWithoutChannelInput
  }

  export type ChannelUncheckedCreateWithoutConversationsInput = {
    id?: string
    name: string
    type: string
    status?: string
    phone_number?: string | null
    instance_id?: string | null
    api_key?: string | null
    webhook_url?: string | null
    settings?: JsonNullValueInput | InputJsonValue
    company_id: string
    created_at?: Date | string
    updated_at?: Date | string
    channel_bots?: ChannelBotUncheckedCreateNestedManyWithoutChannelInput
    webhook_events?: WebhookEventUncheckedCreateNestedManyWithoutChannelInput
  }

  export type ChannelCreateOrConnectWithoutConversationsInput = {
    where: ChannelWhereUniqueInput
    create: XOR<ChannelCreateWithoutConversationsInput, ChannelUncheckedCreateWithoutConversationsInput>
  }

  export type BotCreateWithoutConversationsInput = {
    id?: string
    name: string
    description?: string | null
    is_active?: boolean
    flow_data?: JsonNullValueInput | InputJsonValue
    created_at?: Date | string
    updated_at?: Date | string
    company: CompanyCreateNestedOneWithoutBotsInput
    channel_bots?: ChannelBotCreateNestedManyWithoutBotInput
  }

  export type BotUncheckedCreateWithoutConversationsInput = {
    id?: string
    name: string
    description?: string | null
    is_active?: boolean
    flow_data?: JsonNullValueInput | InputJsonValue
    company_id: string
    created_at?: Date | string
    updated_at?: Date | string
    channel_bots?: ChannelBotUncheckedCreateNestedManyWithoutBotInput
  }

  export type BotCreateOrConnectWithoutConversationsInput = {
    where: BotWhereUniqueInput
    create: XOR<BotCreateWithoutConversationsInput, BotUncheckedCreateWithoutConversationsInput>
  }

  export type UserCreateWithoutAssigned_conversationsInput = {
    id?: string
    email: string
    password_hash: string
    name: string
    role?: string
    is_active?: boolean
    created_at?: Date | string
    updated_at?: Date | string
    company: CompanyCreateNestedOneWithoutUsersInput
    assigned_tickets?: TicketCreateNestedManyWithoutAssigned_userInput
  }

  export type UserUncheckedCreateWithoutAssigned_conversationsInput = {
    id?: string
    email: string
    password_hash: string
    name: string
    role?: string
    company_id: string
    is_active?: boolean
    created_at?: Date | string
    updated_at?: Date | string
    assigned_tickets?: TicketUncheckedCreateNestedManyWithoutAssigned_userInput
  }

  export type UserCreateOrConnectWithoutAssigned_conversationsInput = {
    where: UserWhereUniqueInput
    create: XOR<UserCreateWithoutAssigned_conversationsInput, UserUncheckedCreateWithoutAssigned_conversationsInput>
  }

  export type CompanyCreateWithoutConversationsInput = {
    id?: string
    name: string
    slug: string
    settings?: JsonNullValueInput | InputJsonValue
    created_at?: Date | string
    updated_at?: Date | string
    users?: UserCreateNestedManyWithoutCompanyInput
    channels?: ChannelCreateNestedManyWithoutCompanyInput
    bots?: BotCreateNestedManyWithoutCompanyInput
    contacts?: ContactCreateNestedManyWithoutCompanyInput
    tickets?: TicketCreateNestedManyWithoutCompanyInput
  }

  export type CompanyUncheckedCreateWithoutConversationsInput = {
    id?: string
    name: string
    slug: string
    settings?: JsonNullValueInput | InputJsonValue
    created_at?: Date | string
    updated_at?: Date | string
    users?: UserUncheckedCreateNestedManyWithoutCompanyInput
    channels?: ChannelUncheckedCreateNestedManyWithoutCompanyInput
    bots?: BotUncheckedCreateNestedManyWithoutCompanyInput
    contacts?: ContactUncheckedCreateNestedManyWithoutCompanyInput
    tickets?: TicketUncheckedCreateNestedManyWithoutCompanyInput
  }

  export type CompanyCreateOrConnectWithoutConversationsInput = {
    where: CompanyWhereUniqueInput
    create: XOR<CompanyCreateWithoutConversationsInput, CompanyUncheckedCreateWithoutConversationsInput>
  }

  export type MessageCreateWithoutConversationInput = {
    id?: string
    content: string
    message_type?: string
    sender_type: string
    sender_id?: string | null
    external_id?: string | null
    metadata?: JsonNullValueInput | InputJsonValue
    created_at?: Date | string
  }

  export type MessageUncheckedCreateWithoutConversationInput = {
    id?: string
    content: string
    message_type?: string
    sender_type: string
    sender_id?: string | null
    external_id?: string | null
    metadata?: JsonNullValueInput | InputJsonValue
    created_at?: Date | string
  }

  export type MessageCreateOrConnectWithoutConversationInput = {
    where: MessageWhereUniqueInput
    create: XOR<MessageCreateWithoutConversationInput, MessageUncheckedCreateWithoutConversationInput>
  }

  export type MessageCreateManyConversationInputEnvelope = {
    data: MessageCreateManyConversationInput | MessageCreateManyConversationInput[]
    skipDuplicates?: boolean
  }

  export type TicketCreateWithoutConversationInput = {
    id?: string
    ticket_number: string
    title: string
    description?: string | null
    status?: string
    priority?: string
    form_data?: JsonNullValueInput | InputJsonValue
    created_at?: Date | string
    updated_at?: Date | string
    assigned_user?: UserCreateNestedOneWithoutAssigned_ticketsInput
    company: CompanyCreateNestedOneWithoutTicketsInput
  }

  export type TicketUncheckedCreateWithoutConversationInput = {
    id?: string
    ticket_number: string
    title: string
    description?: string | null
    status?: string
    priority?: string
    assigned_to?: string | null
    form_data?: JsonNullValueInput | InputJsonValue
    company_id: string
    created_at?: Date | string
    updated_at?: Date | string
  }

  export type TicketCreateOrConnectWithoutConversationInput = {
    where: TicketWhereUniqueInput
    create: XOR<TicketCreateWithoutConversationInput, TicketUncheckedCreateWithoutConversationInput>
  }

  export type TicketCreateManyConversationInputEnvelope = {
    data: TicketCreateManyConversationInput | TicketCreateManyConversationInput[]
    skipDuplicates?: boolean
  }

  export type ContactUpsertWithoutConversationsInput = {
    update: XOR<ContactUpdateWithoutConversationsInput, ContactUncheckedUpdateWithoutConversationsInput>
    create: XOR<ContactCreateWithoutConversationsInput, ContactUncheckedCreateWithoutConversationsInput>
    where?: ContactWhereInput
  }

  export type ContactUpdateToOneWithWhereWithoutConversationsInput = {
    where?: ContactWhereInput
    data: XOR<ContactUpdateWithoutConversationsInput, ContactUncheckedUpdateWithoutConversationsInput>
  }

  export type ContactUpdateWithoutConversationsInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: NullableStringFieldUpdateOperationsInput | string | null
    phone?: StringFieldUpdateOperationsInput | string
    email?: NullableStringFieldUpdateOperationsInput | string | null
    avatar_url?: NullableStringFieldUpdateOperationsInput | string | null
    metadata?: JsonNullValueInput | InputJsonValue
    created_at?: DateTimeFieldUpdateOperationsInput | Date | string
    updated_at?: DateTimeFieldUpdateOperationsInput | Date | string
    company?: CompanyUpdateOneRequiredWithoutContactsNestedInput
  }

  export type ContactUncheckedUpdateWithoutConversationsInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: NullableStringFieldUpdateOperationsInput | string | null
    phone?: StringFieldUpdateOperationsInput | string
    email?: NullableStringFieldUpdateOperationsInput | string | null
    avatar_url?: NullableStringFieldUpdateOperationsInput | string | null
    metadata?: JsonNullValueInput | InputJsonValue
    company_id?: StringFieldUpdateOperationsInput | string
    created_at?: DateTimeFieldUpdateOperationsInput | Date | string
    updated_at?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type ChannelUpsertWithoutConversationsInput = {
    update: XOR<ChannelUpdateWithoutConversationsInput, ChannelUncheckedUpdateWithoutConversationsInput>
    create: XOR<ChannelCreateWithoutConversationsInput, ChannelUncheckedCreateWithoutConversationsInput>
    where?: ChannelWhereInput
  }

  export type ChannelUpdateToOneWithWhereWithoutConversationsInput = {
    where?: ChannelWhereInput
    data: XOR<ChannelUpdateWithoutConversationsInput, ChannelUncheckedUpdateWithoutConversationsInput>
  }

  export type ChannelUpdateWithoutConversationsInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    type?: StringFieldUpdateOperationsInput | string
    status?: StringFieldUpdateOperationsInput | string
    phone_number?: NullableStringFieldUpdateOperationsInput | string | null
    instance_id?: NullableStringFieldUpdateOperationsInput | string | null
    api_key?: NullableStringFieldUpdateOperationsInput | string | null
    webhook_url?: NullableStringFieldUpdateOperationsInput | string | null
    settings?: JsonNullValueInput | InputJsonValue
    created_at?: DateTimeFieldUpdateOperationsInput | Date | string
    updated_at?: DateTimeFieldUpdateOperationsInput | Date | string
    company?: CompanyUpdateOneRequiredWithoutChannelsNestedInput
    channel_bots?: ChannelBotUpdateManyWithoutChannelNestedInput
    webhook_events?: WebhookEventUpdateManyWithoutChannelNestedInput
  }

  export type ChannelUncheckedUpdateWithoutConversationsInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    type?: StringFieldUpdateOperationsInput | string
    status?: StringFieldUpdateOperationsInput | string
    phone_number?: NullableStringFieldUpdateOperationsInput | string | null
    instance_id?: NullableStringFieldUpdateOperationsInput | string | null
    api_key?: NullableStringFieldUpdateOperationsInput | string | null
    webhook_url?: NullableStringFieldUpdateOperationsInput | string | null
    settings?: JsonNullValueInput | InputJsonValue
    company_id?: StringFieldUpdateOperationsInput | string
    created_at?: DateTimeFieldUpdateOperationsInput | Date | string
    updated_at?: DateTimeFieldUpdateOperationsInput | Date | string
    channel_bots?: ChannelBotUncheckedUpdateManyWithoutChannelNestedInput
    webhook_events?: WebhookEventUncheckedUpdateManyWithoutChannelNestedInput
  }

  export type BotUpsertWithoutConversationsInput = {
    update: XOR<BotUpdateWithoutConversationsInput, BotUncheckedUpdateWithoutConversationsInput>
    create: XOR<BotCreateWithoutConversationsInput, BotUncheckedCreateWithoutConversationsInput>
    where?: BotWhereInput
  }

  export type BotUpdateToOneWithWhereWithoutConversationsInput = {
    where?: BotWhereInput
    data: XOR<BotUpdateWithoutConversationsInput, BotUncheckedUpdateWithoutConversationsInput>
  }

  export type BotUpdateWithoutConversationsInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    description?: NullableStringFieldUpdateOperationsInput | string | null
    is_active?: BoolFieldUpdateOperationsInput | boolean
    flow_data?: JsonNullValueInput | InputJsonValue
    created_at?: DateTimeFieldUpdateOperationsInput | Date | string
    updated_at?: DateTimeFieldUpdateOperationsInput | Date | string
    company?: CompanyUpdateOneRequiredWithoutBotsNestedInput
    channel_bots?: ChannelBotUpdateManyWithoutBotNestedInput
  }

  export type BotUncheckedUpdateWithoutConversationsInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    description?: NullableStringFieldUpdateOperationsInput | string | null
    is_active?: BoolFieldUpdateOperationsInput | boolean
    flow_data?: JsonNullValueInput | InputJsonValue
    company_id?: StringFieldUpdateOperationsInput | string
    created_at?: DateTimeFieldUpdateOperationsInput | Date | string
    updated_at?: DateTimeFieldUpdateOperationsInput | Date | string
    channel_bots?: ChannelBotUncheckedUpdateManyWithoutBotNestedInput
  }

  export type UserUpsertWithoutAssigned_conversationsInput = {
    update: XOR<UserUpdateWithoutAssigned_conversationsInput, UserUncheckedUpdateWithoutAssigned_conversationsInput>
    create: XOR<UserCreateWithoutAssigned_conversationsInput, UserUncheckedCreateWithoutAssigned_conversationsInput>
    where?: UserWhereInput
  }

  export type UserUpdateToOneWithWhereWithoutAssigned_conversationsInput = {
    where?: UserWhereInput
    data: XOR<UserUpdateWithoutAssigned_conversationsInput, UserUncheckedUpdateWithoutAssigned_conversationsInput>
  }

  export type UserUpdateWithoutAssigned_conversationsInput = {
    id?: StringFieldUpdateOperationsInput | string
    email?: StringFieldUpdateOperationsInput | string
    password_hash?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    role?: StringFieldUpdateOperationsInput | string
    is_active?: BoolFieldUpdateOperationsInput | boolean
    created_at?: DateTimeFieldUpdateOperationsInput | Date | string
    updated_at?: DateTimeFieldUpdateOperationsInput | Date | string
    company?: CompanyUpdateOneRequiredWithoutUsersNestedInput
    assigned_tickets?: TicketUpdateManyWithoutAssigned_userNestedInput
  }

  export type UserUncheckedUpdateWithoutAssigned_conversationsInput = {
    id?: StringFieldUpdateOperationsInput | string
    email?: StringFieldUpdateOperationsInput | string
    password_hash?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    role?: StringFieldUpdateOperationsInput | string
    company_id?: StringFieldUpdateOperationsInput | string
    is_active?: BoolFieldUpdateOperationsInput | boolean
    created_at?: DateTimeFieldUpdateOperationsInput | Date | string
    updated_at?: DateTimeFieldUpdateOperationsInput | Date | string
    assigned_tickets?: TicketUncheckedUpdateManyWithoutAssigned_userNestedInput
  }

  export type CompanyUpsertWithoutConversationsInput = {
    update: XOR<CompanyUpdateWithoutConversationsInput, CompanyUncheckedUpdateWithoutConversationsInput>
    create: XOR<CompanyCreateWithoutConversationsInput, CompanyUncheckedCreateWithoutConversationsInput>
    where?: CompanyWhereInput
  }

  export type CompanyUpdateToOneWithWhereWithoutConversationsInput = {
    where?: CompanyWhereInput
    data: XOR<CompanyUpdateWithoutConversationsInput, CompanyUncheckedUpdateWithoutConversationsInput>
  }

  export type CompanyUpdateWithoutConversationsInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    slug?: StringFieldUpdateOperationsInput | string
    settings?: JsonNullValueInput | InputJsonValue
    created_at?: DateTimeFieldUpdateOperationsInput | Date | string
    updated_at?: DateTimeFieldUpdateOperationsInput | Date | string
    users?: UserUpdateManyWithoutCompanyNestedInput
    channels?: ChannelUpdateManyWithoutCompanyNestedInput
    bots?: BotUpdateManyWithoutCompanyNestedInput
    contacts?: ContactUpdateManyWithoutCompanyNestedInput
    tickets?: TicketUpdateManyWithoutCompanyNestedInput
  }

  export type CompanyUncheckedUpdateWithoutConversationsInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    slug?: StringFieldUpdateOperationsInput | string
    settings?: JsonNullValueInput | InputJsonValue
    created_at?: DateTimeFieldUpdateOperationsInput | Date | string
    updated_at?: DateTimeFieldUpdateOperationsInput | Date | string
    users?: UserUncheckedUpdateManyWithoutCompanyNestedInput
    channels?: ChannelUncheckedUpdateManyWithoutCompanyNestedInput
    bots?: BotUncheckedUpdateManyWithoutCompanyNestedInput
    contacts?: ContactUncheckedUpdateManyWithoutCompanyNestedInput
    tickets?: TicketUncheckedUpdateManyWithoutCompanyNestedInput
  }

  export type MessageUpsertWithWhereUniqueWithoutConversationInput = {
    where: MessageWhereUniqueInput
    update: XOR<MessageUpdateWithoutConversationInput, MessageUncheckedUpdateWithoutConversationInput>
    create: XOR<MessageCreateWithoutConversationInput, MessageUncheckedCreateWithoutConversationInput>
  }

  export type MessageUpdateWithWhereUniqueWithoutConversationInput = {
    where: MessageWhereUniqueInput
    data: XOR<MessageUpdateWithoutConversationInput, MessageUncheckedUpdateWithoutConversationInput>
  }

  export type MessageUpdateManyWithWhereWithoutConversationInput = {
    where: MessageScalarWhereInput
    data: XOR<MessageUpdateManyMutationInput, MessageUncheckedUpdateManyWithoutConversationInput>
  }

  export type MessageScalarWhereInput = {
    AND?: MessageScalarWhereInput | MessageScalarWhereInput[]
    OR?: MessageScalarWhereInput[]
    NOT?: MessageScalarWhereInput | MessageScalarWhereInput[]
    id?: UuidFilter<"Message"> | string
    conversation_id?: UuidFilter<"Message"> | string
    content?: StringFilter<"Message"> | string
    message_type?: StringFilter<"Message"> | string
    sender_type?: StringFilter<"Message"> | string
    sender_id?: UuidNullableFilter<"Message"> | string | null
    external_id?: StringNullableFilter<"Message"> | string | null
    metadata?: JsonFilter<"Message">
    created_at?: DateTimeFilter<"Message"> | Date | string
  }

  export type TicketUpsertWithWhereUniqueWithoutConversationInput = {
    where: TicketWhereUniqueInput
    update: XOR<TicketUpdateWithoutConversationInput, TicketUncheckedUpdateWithoutConversationInput>
    create: XOR<TicketCreateWithoutConversationInput, TicketUncheckedCreateWithoutConversationInput>
  }

  export type TicketUpdateWithWhereUniqueWithoutConversationInput = {
    where: TicketWhereUniqueInput
    data: XOR<TicketUpdateWithoutConversationInput, TicketUncheckedUpdateWithoutConversationInput>
  }

  export type TicketUpdateManyWithWhereWithoutConversationInput = {
    where: TicketScalarWhereInput
    data: XOR<TicketUpdateManyMutationInput, TicketUncheckedUpdateManyWithoutConversationInput>
  }

  export type ConversationCreateWithoutMessagesInput = {
    id?: string
    status?: string
    last_message_at?: Date | string
    metadata?: JsonNullValueInput | InputJsonValue
    created_at?: Date | string
    updated_at?: Date | string
    contact: ContactCreateNestedOneWithoutConversationsInput
    channel: ChannelCreateNestedOneWithoutConversationsInput
    bot?: BotCreateNestedOneWithoutConversationsInput
    assigned_user?: UserCreateNestedOneWithoutAssigned_conversationsInput
    company: CompanyCreateNestedOneWithoutConversationsInput
    tickets?: TicketCreateNestedManyWithoutConversationInput
  }

  export type ConversationUncheckedCreateWithoutMessagesInput = {
    id?: string
    contact_id: string
    channel_id: string
    bot_id?: string | null
    status?: string
    assigned_to?: string | null
    last_message_at?: Date | string
    company_id: string
    metadata?: JsonNullValueInput | InputJsonValue
    created_at?: Date | string
    updated_at?: Date | string
    tickets?: TicketUncheckedCreateNestedManyWithoutConversationInput
  }

  export type ConversationCreateOrConnectWithoutMessagesInput = {
    where: ConversationWhereUniqueInput
    create: XOR<ConversationCreateWithoutMessagesInput, ConversationUncheckedCreateWithoutMessagesInput>
  }

  export type ConversationUpsertWithoutMessagesInput = {
    update: XOR<ConversationUpdateWithoutMessagesInput, ConversationUncheckedUpdateWithoutMessagesInput>
    create: XOR<ConversationCreateWithoutMessagesInput, ConversationUncheckedCreateWithoutMessagesInput>
    where?: ConversationWhereInput
  }

  export type ConversationUpdateToOneWithWhereWithoutMessagesInput = {
    where?: ConversationWhereInput
    data: XOR<ConversationUpdateWithoutMessagesInput, ConversationUncheckedUpdateWithoutMessagesInput>
  }

  export type ConversationUpdateWithoutMessagesInput = {
    id?: StringFieldUpdateOperationsInput | string
    status?: StringFieldUpdateOperationsInput | string
    last_message_at?: DateTimeFieldUpdateOperationsInput | Date | string
    metadata?: JsonNullValueInput | InputJsonValue
    created_at?: DateTimeFieldUpdateOperationsInput | Date | string
    updated_at?: DateTimeFieldUpdateOperationsInput | Date | string
    contact?: ContactUpdateOneRequiredWithoutConversationsNestedInput
    channel?: ChannelUpdateOneRequiredWithoutConversationsNestedInput
    bot?: BotUpdateOneWithoutConversationsNestedInput
    assigned_user?: UserUpdateOneWithoutAssigned_conversationsNestedInput
    company?: CompanyUpdateOneRequiredWithoutConversationsNestedInput
    tickets?: TicketUpdateManyWithoutConversationNestedInput
  }

  export type ConversationUncheckedUpdateWithoutMessagesInput = {
    id?: StringFieldUpdateOperationsInput | string
    contact_id?: StringFieldUpdateOperationsInput | string
    channel_id?: StringFieldUpdateOperationsInput | string
    bot_id?: NullableStringFieldUpdateOperationsInput | string | null
    status?: StringFieldUpdateOperationsInput | string
    assigned_to?: NullableStringFieldUpdateOperationsInput | string | null
    last_message_at?: DateTimeFieldUpdateOperationsInput | Date | string
    company_id?: StringFieldUpdateOperationsInput | string
    metadata?: JsonNullValueInput | InputJsonValue
    created_at?: DateTimeFieldUpdateOperationsInput | Date | string
    updated_at?: DateTimeFieldUpdateOperationsInput | Date | string
    tickets?: TicketUncheckedUpdateManyWithoutConversationNestedInput
  }

  export type ConversationCreateWithoutTicketsInput = {
    id?: string
    status?: string
    last_message_at?: Date | string
    metadata?: JsonNullValueInput | InputJsonValue
    created_at?: Date | string
    updated_at?: Date | string
    contact: ContactCreateNestedOneWithoutConversationsInput
    channel: ChannelCreateNestedOneWithoutConversationsInput
    bot?: BotCreateNestedOneWithoutConversationsInput
    assigned_user?: UserCreateNestedOneWithoutAssigned_conversationsInput
    company: CompanyCreateNestedOneWithoutConversationsInput
    messages?: MessageCreateNestedManyWithoutConversationInput
  }

  export type ConversationUncheckedCreateWithoutTicketsInput = {
    id?: string
    contact_id: string
    channel_id: string
    bot_id?: string | null
    status?: string
    assigned_to?: string | null
    last_message_at?: Date | string
    company_id: string
    metadata?: JsonNullValueInput | InputJsonValue
    created_at?: Date | string
    updated_at?: Date | string
    messages?: MessageUncheckedCreateNestedManyWithoutConversationInput
  }

  export type ConversationCreateOrConnectWithoutTicketsInput = {
    where: ConversationWhereUniqueInput
    create: XOR<ConversationCreateWithoutTicketsInput, ConversationUncheckedCreateWithoutTicketsInput>
  }

  export type UserCreateWithoutAssigned_ticketsInput = {
    id?: string
    email: string
    password_hash: string
    name: string
    role?: string
    is_active?: boolean
    created_at?: Date | string
    updated_at?: Date | string
    company: CompanyCreateNestedOneWithoutUsersInput
    assigned_conversations?: ConversationCreateNestedManyWithoutAssigned_userInput
  }

  export type UserUncheckedCreateWithoutAssigned_ticketsInput = {
    id?: string
    email: string
    password_hash: string
    name: string
    role?: string
    company_id: string
    is_active?: boolean
    created_at?: Date | string
    updated_at?: Date | string
    assigned_conversations?: ConversationUncheckedCreateNestedManyWithoutAssigned_userInput
  }

  export type UserCreateOrConnectWithoutAssigned_ticketsInput = {
    where: UserWhereUniqueInput
    create: XOR<UserCreateWithoutAssigned_ticketsInput, UserUncheckedCreateWithoutAssigned_ticketsInput>
  }

  export type CompanyCreateWithoutTicketsInput = {
    id?: string
    name: string
    slug: string
    settings?: JsonNullValueInput | InputJsonValue
    created_at?: Date | string
    updated_at?: Date | string
    users?: UserCreateNestedManyWithoutCompanyInput
    channels?: ChannelCreateNestedManyWithoutCompanyInput
    bots?: BotCreateNestedManyWithoutCompanyInput
    contacts?: ContactCreateNestedManyWithoutCompanyInput
    conversations?: ConversationCreateNestedManyWithoutCompanyInput
  }

  export type CompanyUncheckedCreateWithoutTicketsInput = {
    id?: string
    name: string
    slug: string
    settings?: JsonNullValueInput | InputJsonValue
    created_at?: Date | string
    updated_at?: Date | string
    users?: UserUncheckedCreateNestedManyWithoutCompanyInput
    channels?: ChannelUncheckedCreateNestedManyWithoutCompanyInput
    bots?: BotUncheckedCreateNestedManyWithoutCompanyInput
    contacts?: ContactUncheckedCreateNestedManyWithoutCompanyInput
    conversations?: ConversationUncheckedCreateNestedManyWithoutCompanyInput
  }

  export type CompanyCreateOrConnectWithoutTicketsInput = {
    where: CompanyWhereUniqueInput
    create: XOR<CompanyCreateWithoutTicketsInput, CompanyUncheckedCreateWithoutTicketsInput>
  }

  export type ConversationUpsertWithoutTicketsInput = {
    update: XOR<ConversationUpdateWithoutTicketsInput, ConversationUncheckedUpdateWithoutTicketsInput>
    create: XOR<ConversationCreateWithoutTicketsInput, ConversationUncheckedCreateWithoutTicketsInput>
    where?: ConversationWhereInput
  }

  export type ConversationUpdateToOneWithWhereWithoutTicketsInput = {
    where?: ConversationWhereInput
    data: XOR<ConversationUpdateWithoutTicketsInput, ConversationUncheckedUpdateWithoutTicketsInput>
  }

  export type ConversationUpdateWithoutTicketsInput = {
    id?: StringFieldUpdateOperationsInput | string
    status?: StringFieldUpdateOperationsInput | string
    last_message_at?: DateTimeFieldUpdateOperationsInput | Date | string
    metadata?: JsonNullValueInput | InputJsonValue
    created_at?: DateTimeFieldUpdateOperationsInput | Date | string
    updated_at?: DateTimeFieldUpdateOperationsInput | Date | string
    contact?: ContactUpdateOneRequiredWithoutConversationsNestedInput
    channel?: ChannelUpdateOneRequiredWithoutConversationsNestedInput
    bot?: BotUpdateOneWithoutConversationsNestedInput
    assigned_user?: UserUpdateOneWithoutAssigned_conversationsNestedInput
    company?: CompanyUpdateOneRequiredWithoutConversationsNestedInput
    messages?: MessageUpdateManyWithoutConversationNestedInput
  }

  export type ConversationUncheckedUpdateWithoutTicketsInput = {
    id?: StringFieldUpdateOperationsInput | string
    contact_id?: StringFieldUpdateOperationsInput | string
    channel_id?: StringFieldUpdateOperationsInput | string
    bot_id?: NullableStringFieldUpdateOperationsInput | string | null
    status?: StringFieldUpdateOperationsInput | string
    assigned_to?: NullableStringFieldUpdateOperationsInput | string | null
    last_message_at?: DateTimeFieldUpdateOperationsInput | Date | string
    company_id?: StringFieldUpdateOperationsInput | string
    metadata?: JsonNullValueInput | InputJsonValue
    created_at?: DateTimeFieldUpdateOperationsInput | Date | string
    updated_at?: DateTimeFieldUpdateOperationsInput | Date | string
    messages?: MessageUncheckedUpdateManyWithoutConversationNestedInput
  }

  export type UserUpsertWithoutAssigned_ticketsInput = {
    update: XOR<UserUpdateWithoutAssigned_ticketsInput, UserUncheckedUpdateWithoutAssigned_ticketsInput>
    create: XOR<UserCreateWithoutAssigned_ticketsInput, UserUncheckedCreateWithoutAssigned_ticketsInput>
    where?: UserWhereInput
  }

  export type UserUpdateToOneWithWhereWithoutAssigned_ticketsInput = {
    where?: UserWhereInput
    data: XOR<UserUpdateWithoutAssigned_ticketsInput, UserUncheckedUpdateWithoutAssigned_ticketsInput>
  }

  export type UserUpdateWithoutAssigned_ticketsInput = {
    id?: StringFieldUpdateOperationsInput | string
    email?: StringFieldUpdateOperationsInput | string
    password_hash?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    role?: StringFieldUpdateOperationsInput | string
    is_active?: BoolFieldUpdateOperationsInput | boolean
    created_at?: DateTimeFieldUpdateOperationsInput | Date | string
    updated_at?: DateTimeFieldUpdateOperationsInput | Date | string
    company?: CompanyUpdateOneRequiredWithoutUsersNestedInput
    assigned_conversations?: ConversationUpdateManyWithoutAssigned_userNestedInput
  }

  export type UserUncheckedUpdateWithoutAssigned_ticketsInput = {
    id?: StringFieldUpdateOperationsInput | string
    email?: StringFieldUpdateOperationsInput | string
    password_hash?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    role?: StringFieldUpdateOperationsInput | string
    company_id?: StringFieldUpdateOperationsInput | string
    is_active?: BoolFieldUpdateOperationsInput | boolean
    created_at?: DateTimeFieldUpdateOperationsInput | Date | string
    updated_at?: DateTimeFieldUpdateOperationsInput | Date | string
    assigned_conversations?: ConversationUncheckedUpdateManyWithoutAssigned_userNestedInput
  }

  export type CompanyUpsertWithoutTicketsInput = {
    update: XOR<CompanyUpdateWithoutTicketsInput, CompanyUncheckedUpdateWithoutTicketsInput>
    create: XOR<CompanyCreateWithoutTicketsInput, CompanyUncheckedCreateWithoutTicketsInput>
    where?: CompanyWhereInput
  }

  export type CompanyUpdateToOneWithWhereWithoutTicketsInput = {
    where?: CompanyWhereInput
    data: XOR<CompanyUpdateWithoutTicketsInput, CompanyUncheckedUpdateWithoutTicketsInput>
  }

  export type CompanyUpdateWithoutTicketsInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    slug?: StringFieldUpdateOperationsInput | string
    settings?: JsonNullValueInput | InputJsonValue
    created_at?: DateTimeFieldUpdateOperationsInput | Date | string
    updated_at?: DateTimeFieldUpdateOperationsInput | Date | string
    users?: UserUpdateManyWithoutCompanyNestedInput
    channels?: ChannelUpdateManyWithoutCompanyNestedInput
    bots?: BotUpdateManyWithoutCompanyNestedInput
    contacts?: ContactUpdateManyWithoutCompanyNestedInput
    conversations?: ConversationUpdateManyWithoutCompanyNestedInput
  }

  export type CompanyUncheckedUpdateWithoutTicketsInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    slug?: StringFieldUpdateOperationsInput | string
    settings?: JsonNullValueInput | InputJsonValue
    created_at?: DateTimeFieldUpdateOperationsInput | Date | string
    updated_at?: DateTimeFieldUpdateOperationsInput | Date | string
    users?: UserUncheckedUpdateManyWithoutCompanyNestedInput
    channels?: ChannelUncheckedUpdateManyWithoutCompanyNestedInput
    bots?: BotUncheckedUpdateManyWithoutCompanyNestedInput
    contacts?: ContactUncheckedUpdateManyWithoutCompanyNestedInput
    conversations?: ConversationUncheckedUpdateManyWithoutCompanyNestedInput
  }

  export type ChannelCreateWithoutWebhook_eventsInput = {
    id?: string
    name: string
    type: string
    status?: string
    phone_number?: string | null
    instance_id?: string | null
    api_key?: string | null
    webhook_url?: string | null
    settings?: JsonNullValueInput | InputJsonValue
    created_at?: Date | string
    updated_at?: Date | string
    company: CompanyCreateNestedOneWithoutChannelsInput
    conversations?: ConversationCreateNestedManyWithoutChannelInput
    channel_bots?: ChannelBotCreateNestedManyWithoutChannelInput
  }

  export type ChannelUncheckedCreateWithoutWebhook_eventsInput = {
    id?: string
    name: string
    type: string
    status?: string
    phone_number?: string | null
    instance_id?: string | null
    api_key?: string | null
    webhook_url?: string | null
    settings?: JsonNullValueInput | InputJsonValue
    company_id: string
    created_at?: Date | string
    updated_at?: Date | string
    conversations?: ConversationUncheckedCreateNestedManyWithoutChannelInput
    channel_bots?: ChannelBotUncheckedCreateNestedManyWithoutChannelInput
  }

  export type ChannelCreateOrConnectWithoutWebhook_eventsInput = {
    where: ChannelWhereUniqueInput
    create: XOR<ChannelCreateWithoutWebhook_eventsInput, ChannelUncheckedCreateWithoutWebhook_eventsInput>
  }

  export type ChannelUpsertWithoutWebhook_eventsInput = {
    update: XOR<ChannelUpdateWithoutWebhook_eventsInput, ChannelUncheckedUpdateWithoutWebhook_eventsInput>
    create: XOR<ChannelCreateWithoutWebhook_eventsInput, ChannelUncheckedCreateWithoutWebhook_eventsInput>
    where?: ChannelWhereInput
  }

  export type ChannelUpdateToOneWithWhereWithoutWebhook_eventsInput = {
    where?: ChannelWhereInput
    data: XOR<ChannelUpdateWithoutWebhook_eventsInput, ChannelUncheckedUpdateWithoutWebhook_eventsInput>
  }

  export type ChannelUpdateWithoutWebhook_eventsInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    type?: StringFieldUpdateOperationsInput | string
    status?: StringFieldUpdateOperationsInput | string
    phone_number?: NullableStringFieldUpdateOperationsInput | string | null
    instance_id?: NullableStringFieldUpdateOperationsInput | string | null
    api_key?: NullableStringFieldUpdateOperationsInput | string | null
    webhook_url?: NullableStringFieldUpdateOperationsInput | string | null
    settings?: JsonNullValueInput | InputJsonValue
    created_at?: DateTimeFieldUpdateOperationsInput | Date | string
    updated_at?: DateTimeFieldUpdateOperationsInput | Date | string
    company?: CompanyUpdateOneRequiredWithoutChannelsNestedInput
    conversations?: ConversationUpdateManyWithoutChannelNestedInput
    channel_bots?: ChannelBotUpdateManyWithoutChannelNestedInput
  }

  export type ChannelUncheckedUpdateWithoutWebhook_eventsInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    type?: StringFieldUpdateOperationsInput | string
    status?: StringFieldUpdateOperationsInput | string
    phone_number?: NullableStringFieldUpdateOperationsInput | string | null
    instance_id?: NullableStringFieldUpdateOperationsInput | string | null
    api_key?: NullableStringFieldUpdateOperationsInput | string | null
    webhook_url?: NullableStringFieldUpdateOperationsInput | string | null
    settings?: JsonNullValueInput | InputJsonValue
    company_id?: StringFieldUpdateOperationsInput | string
    created_at?: DateTimeFieldUpdateOperationsInput | Date | string
    updated_at?: DateTimeFieldUpdateOperationsInput | Date | string
    conversations?: ConversationUncheckedUpdateManyWithoutChannelNestedInput
    channel_bots?: ChannelBotUncheckedUpdateManyWithoutChannelNestedInput
  }

  export type UserCreateManyCompanyInput = {
    id?: string
    email: string
    password_hash: string
    name: string
    role?: string
    is_active?: boolean
    created_at?: Date | string
    updated_at?: Date | string
  }

  export type ChannelCreateManyCompanyInput = {
    id?: string
    name: string
    type: string
    status?: string
    phone_number?: string | null
    instance_id?: string | null
    api_key?: string | null
    webhook_url?: string | null
    settings?: JsonNullValueInput | InputJsonValue
    created_at?: Date | string
    updated_at?: Date | string
  }

  export type BotCreateManyCompanyInput = {
    id?: string
    name: string
    description?: string | null
    is_active?: boolean
    flow_data?: JsonNullValueInput | InputJsonValue
    created_at?: Date | string
    updated_at?: Date | string
  }

  export type ContactCreateManyCompanyInput = {
    id?: string
    name?: string | null
    phone: string
    email?: string | null
    avatar_url?: string | null
    metadata?: JsonNullValueInput | InputJsonValue
    created_at?: Date | string
    updated_at?: Date | string
  }

  export type ConversationCreateManyCompanyInput = {
    id?: string
    contact_id: string
    channel_id: string
    bot_id?: string | null
    status?: string
    assigned_to?: string | null
    last_message_at?: Date | string
    metadata?: JsonNullValueInput | InputJsonValue
    created_at?: Date | string
    updated_at?: Date | string
  }

  export type TicketCreateManyCompanyInput = {
    id?: string
    ticket_number: string
    conversation_id: string
    title: string
    description?: string | null
    status?: string
    priority?: string
    assigned_to?: string | null
    form_data?: JsonNullValueInput | InputJsonValue
    created_at?: Date | string
    updated_at?: Date | string
  }

  export type UserUpdateWithoutCompanyInput = {
    id?: StringFieldUpdateOperationsInput | string
    email?: StringFieldUpdateOperationsInput | string
    password_hash?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    role?: StringFieldUpdateOperationsInput | string
    is_active?: BoolFieldUpdateOperationsInput | boolean
    created_at?: DateTimeFieldUpdateOperationsInput | Date | string
    updated_at?: DateTimeFieldUpdateOperationsInput | Date | string
    assigned_conversations?: ConversationUpdateManyWithoutAssigned_userNestedInput
    assigned_tickets?: TicketUpdateManyWithoutAssigned_userNestedInput
  }

  export type UserUncheckedUpdateWithoutCompanyInput = {
    id?: StringFieldUpdateOperationsInput | string
    email?: StringFieldUpdateOperationsInput | string
    password_hash?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    role?: StringFieldUpdateOperationsInput | string
    is_active?: BoolFieldUpdateOperationsInput | boolean
    created_at?: DateTimeFieldUpdateOperationsInput | Date | string
    updated_at?: DateTimeFieldUpdateOperationsInput | Date | string
    assigned_conversations?: ConversationUncheckedUpdateManyWithoutAssigned_userNestedInput
    assigned_tickets?: TicketUncheckedUpdateManyWithoutAssigned_userNestedInput
  }

  export type UserUncheckedUpdateManyWithoutCompanyInput = {
    id?: StringFieldUpdateOperationsInput | string
    email?: StringFieldUpdateOperationsInput | string
    password_hash?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    role?: StringFieldUpdateOperationsInput | string
    is_active?: BoolFieldUpdateOperationsInput | boolean
    created_at?: DateTimeFieldUpdateOperationsInput | Date | string
    updated_at?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type ChannelUpdateWithoutCompanyInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    type?: StringFieldUpdateOperationsInput | string
    status?: StringFieldUpdateOperationsInput | string
    phone_number?: NullableStringFieldUpdateOperationsInput | string | null
    instance_id?: NullableStringFieldUpdateOperationsInput | string | null
    api_key?: NullableStringFieldUpdateOperationsInput | string | null
    webhook_url?: NullableStringFieldUpdateOperationsInput | string | null
    settings?: JsonNullValueInput | InputJsonValue
    created_at?: DateTimeFieldUpdateOperationsInput | Date | string
    updated_at?: DateTimeFieldUpdateOperationsInput | Date | string
    conversations?: ConversationUpdateManyWithoutChannelNestedInput
    channel_bots?: ChannelBotUpdateManyWithoutChannelNestedInput
    webhook_events?: WebhookEventUpdateManyWithoutChannelNestedInput
  }

  export type ChannelUncheckedUpdateWithoutCompanyInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    type?: StringFieldUpdateOperationsInput | string
    status?: StringFieldUpdateOperationsInput | string
    phone_number?: NullableStringFieldUpdateOperationsInput | string | null
    instance_id?: NullableStringFieldUpdateOperationsInput | string | null
    api_key?: NullableStringFieldUpdateOperationsInput | string | null
    webhook_url?: NullableStringFieldUpdateOperationsInput | string | null
    settings?: JsonNullValueInput | InputJsonValue
    created_at?: DateTimeFieldUpdateOperationsInput | Date | string
    updated_at?: DateTimeFieldUpdateOperationsInput | Date | string
    conversations?: ConversationUncheckedUpdateManyWithoutChannelNestedInput
    channel_bots?: ChannelBotUncheckedUpdateManyWithoutChannelNestedInput
    webhook_events?: WebhookEventUncheckedUpdateManyWithoutChannelNestedInput
  }

  export type ChannelUncheckedUpdateManyWithoutCompanyInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    type?: StringFieldUpdateOperationsInput | string
    status?: StringFieldUpdateOperationsInput | string
    phone_number?: NullableStringFieldUpdateOperationsInput | string | null
    instance_id?: NullableStringFieldUpdateOperationsInput | string | null
    api_key?: NullableStringFieldUpdateOperationsInput | string | null
    webhook_url?: NullableStringFieldUpdateOperationsInput | string | null
    settings?: JsonNullValueInput | InputJsonValue
    created_at?: DateTimeFieldUpdateOperationsInput | Date | string
    updated_at?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type BotUpdateWithoutCompanyInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    description?: NullableStringFieldUpdateOperationsInput | string | null
    is_active?: BoolFieldUpdateOperationsInput | boolean
    flow_data?: JsonNullValueInput | InputJsonValue
    created_at?: DateTimeFieldUpdateOperationsInput | Date | string
    updated_at?: DateTimeFieldUpdateOperationsInput | Date | string
    conversations?: ConversationUpdateManyWithoutBotNestedInput
    channel_bots?: ChannelBotUpdateManyWithoutBotNestedInput
  }

  export type BotUncheckedUpdateWithoutCompanyInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    description?: NullableStringFieldUpdateOperationsInput | string | null
    is_active?: BoolFieldUpdateOperationsInput | boolean
    flow_data?: JsonNullValueInput | InputJsonValue
    created_at?: DateTimeFieldUpdateOperationsInput | Date | string
    updated_at?: DateTimeFieldUpdateOperationsInput | Date | string
    conversations?: ConversationUncheckedUpdateManyWithoutBotNestedInput
    channel_bots?: ChannelBotUncheckedUpdateManyWithoutBotNestedInput
  }

  export type BotUncheckedUpdateManyWithoutCompanyInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    description?: NullableStringFieldUpdateOperationsInput | string | null
    is_active?: BoolFieldUpdateOperationsInput | boolean
    flow_data?: JsonNullValueInput | InputJsonValue
    created_at?: DateTimeFieldUpdateOperationsInput | Date | string
    updated_at?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type ContactUpdateWithoutCompanyInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: NullableStringFieldUpdateOperationsInput | string | null
    phone?: StringFieldUpdateOperationsInput | string
    email?: NullableStringFieldUpdateOperationsInput | string | null
    avatar_url?: NullableStringFieldUpdateOperationsInput | string | null
    metadata?: JsonNullValueInput | InputJsonValue
    created_at?: DateTimeFieldUpdateOperationsInput | Date | string
    updated_at?: DateTimeFieldUpdateOperationsInput | Date | string
    conversations?: ConversationUpdateManyWithoutContactNestedInput
  }

  export type ContactUncheckedUpdateWithoutCompanyInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: NullableStringFieldUpdateOperationsInput | string | null
    phone?: StringFieldUpdateOperationsInput | string
    email?: NullableStringFieldUpdateOperationsInput | string | null
    avatar_url?: NullableStringFieldUpdateOperationsInput | string | null
    metadata?: JsonNullValueInput | InputJsonValue
    created_at?: DateTimeFieldUpdateOperationsInput | Date | string
    updated_at?: DateTimeFieldUpdateOperationsInput | Date | string
    conversations?: ConversationUncheckedUpdateManyWithoutContactNestedInput
  }

  export type ContactUncheckedUpdateManyWithoutCompanyInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: NullableStringFieldUpdateOperationsInput | string | null
    phone?: StringFieldUpdateOperationsInput | string
    email?: NullableStringFieldUpdateOperationsInput | string | null
    avatar_url?: NullableStringFieldUpdateOperationsInput | string | null
    metadata?: JsonNullValueInput | InputJsonValue
    created_at?: DateTimeFieldUpdateOperationsInput | Date | string
    updated_at?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type ConversationUpdateWithoutCompanyInput = {
    id?: StringFieldUpdateOperationsInput | string
    status?: StringFieldUpdateOperationsInput | string
    last_message_at?: DateTimeFieldUpdateOperationsInput | Date | string
    metadata?: JsonNullValueInput | InputJsonValue
    created_at?: DateTimeFieldUpdateOperationsInput | Date | string
    updated_at?: DateTimeFieldUpdateOperationsInput | Date | string
    contact?: ContactUpdateOneRequiredWithoutConversationsNestedInput
    channel?: ChannelUpdateOneRequiredWithoutConversationsNestedInput
    bot?: BotUpdateOneWithoutConversationsNestedInput
    assigned_user?: UserUpdateOneWithoutAssigned_conversationsNestedInput
    messages?: MessageUpdateManyWithoutConversationNestedInput
    tickets?: TicketUpdateManyWithoutConversationNestedInput
  }

  export type ConversationUncheckedUpdateWithoutCompanyInput = {
    id?: StringFieldUpdateOperationsInput | string
    contact_id?: StringFieldUpdateOperationsInput | string
    channel_id?: StringFieldUpdateOperationsInput | string
    bot_id?: NullableStringFieldUpdateOperationsInput | string | null
    status?: StringFieldUpdateOperationsInput | string
    assigned_to?: NullableStringFieldUpdateOperationsInput | string | null
    last_message_at?: DateTimeFieldUpdateOperationsInput | Date | string
    metadata?: JsonNullValueInput | InputJsonValue
    created_at?: DateTimeFieldUpdateOperationsInput | Date | string
    updated_at?: DateTimeFieldUpdateOperationsInput | Date | string
    messages?: MessageUncheckedUpdateManyWithoutConversationNestedInput
    tickets?: TicketUncheckedUpdateManyWithoutConversationNestedInput
  }

  export type ConversationUncheckedUpdateManyWithoutCompanyInput = {
    id?: StringFieldUpdateOperationsInput | string
    contact_id?: StringFieldUpdateOperationsInput | string
    channel_id?: StringFieldUpdateOperationsInput | string
    bot_id?: NullableStringFieldUpdateOperationsInput | string | null
    status?: StringFieldUpdateOperationsInput | string
    assigned_to?: NullableStringFieldUpdateOperationsInput | string | null
    last_message_at?: DateTimeFieldUpdateOperationsInput | Date | string
    metadata?: JsonNullValueInput | InputJsonValue
    created_at?: DateTimeFieldUpdateOperationsInput | Date | string
    updated_at?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type TicketUpdateWithoutCompanyInput = {
    id?: StringFieldUpdateOperationsInput | string
    ticket_number?: StringFieldUpdateOperationsInput | string
    title?: StringFieldUpdateOperationsInput | string
    description?: NullableStringFieldUpdateOperationsInput | string | null
    status?: StringFieldUpdateOperationsInput | string
    priority?: StringFieldUpdateOperationsInput | string
    form_data?: JsonNullValueInput | InputJsonValue
    created_at?: DateTimeFieldUpdateOperationsInput | Date | string
    updated_at?: DateTimeFieldUpdateOperationsInput | Date | string
    conversation?: ConversationUpdateOneRequiredWithoutTicketsNestedInput
    assigned_user?: UserUpdateOneWithoutAssigned_ticketsNestedInput
  }

  export type TicketUncheckedUpdateWithoutCompanyInput = {
    id?: StringFieldUpdateOperationsInput | string
    ticket_number?: StringFieldUpdateOperationsInput | string
    conversation_id?: StringFieldUpdateOperationsInput | string
    title?: StringFieldUpdateOperationsInput | string
    description?: NullableStringFieldUpdateOperationsInput | string | null
    status?: StringFieldUpdateOperationsInput | string
    priority?: StringFieldUpdateOperationsInput | string
    assigned_to?: NullableStringFieldUpdateOperationsInput | string | null
    form_data?: JsonNullValueInput | InputJsonValue
    created_at?: DateTimeFieldUpdateOperationsInput | Date | string
    updated_at?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type TicketUncheckedUpdateManyWithoutCompanyInput = {
    id?: StringFieldUpdateOperationsInput | string
    ticket_number?: StringFieldUpdateOperationsInput | string
    conversation_id?: StringFieldUpdateOperationsInput | string
    title?: StringFieldUpdateOperationsInput | string
    description?: NullableStringFieldUpdateOperationsInput | string | null
    status?: StringFieldUpdateOperationsInput | string
    priority?: StringFieldUpdateOperationsInput | string
    assigned_to?: NullableStringFieldUpdateOperationsInput | string | null
    form_data?: JsonNullValueInput | InputJsonValue
    created_at?: DateTimeFieldUpdateOperationsInput | Date | string
    updated_at?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type ConversationCreateManyAssigned_userInput = {
    id?: string
    contact_id: string
    channel_id: string
    bot_id?: string | null
    status?: string
    last_message_at?: Date | string
    company_id: string
    metadata?: JsonNullValueInput | InputJsonValue
    created_at?: Date | string
    updated_at?: Date | string
  }

  export type TicketCreateManyAssigned_userInput = {
    id?: string
    ticket_number: string
    conversation_id: string
    title: string
    description?: string | null
    status?: string
    priority?: string
    form_data?: JsonNullValueInput | InputJsonValue
    company_id: string
    created_at?: Date | string
    updated_at?: Date | string
  }

  export type ConversationUpdateWithoutAssigned_userInput = {
    id?: StringFieldUpdateOperationsInput | string
    status?: StringFieldUpdateOperationsInput | string
    last_message_at?: DateTimeFieldUpdateOperationsInput | Date | string
    metadata?: JsonNullValueInput | InputJsonValue
    created_at?: DateTimeFieldUpdateOperationsInput | Date | string
    updated_at?: DateTimeFieldUpdateOperationsInput | Date | string
    contact?: ContactUpdateOneRequiredWithoutConversationsNestedInput
    channel?: ChannelUpdateOneRequiredWithoutConversationsNestedInput
    bot?: BotUpdateOneWithoutConversationsNestedInput
    company?: CompanyUpdateOneRequiredWithoutConversationsNestedInput
    messages?: MessageUpdateManyWithoutConversationNestedInput
    tickets?: TicketUpdateManyWithoutConversationNestedInput
  }

  export type ConversationUncheckedUpdateWithoutAssigned_userInput = {
    id?: StringFieldUpdateOperationsInput | string
    contact_id?: StringFieldUpdateOperationsInput | string
    channel_id?: StringFieldUpdateOperationsInput | string
    bot_id?: NullableStringFieldUpdateOperationsInput | string | null
    status?: StringFieldUpdateOperationsInput | string
    last_message_at?: DateTimeFieldUpdateOperationsInput | Date | string
    company_id?: StringFieldUpdateOperationsInput | string
    metadata?: JsonNullValueInput | InputJsonValue
    created_at?: DateTimeFieldUpdateOperationsInput | Date | string
    updated_at?: DateTimeFieldUpdateOperationsInput | Date | string
    messages?: MessageUncheckedUpdateManyWithoutConversationNestedInput
    tickets?: TicketUncheckedUpdateManyWithoutConversationNestedInput
  }

  export type ConversationUncheckedUpdateManyWithoutAssigned_userInput = {
    id?: StringFieldUpdateOperationsInput | string
    contact_id?: StringFieldUpdateOperationsInput | string
    channel_id?: StringFieldUpdateOperationsInput | string
    bot_id?: NullableStringFieldUpdateOperationsInput | string | null
    status?: StringFieldUpdateOperationsInput | string
    last_message_at?: DateTimeFieldUpdateOperationsInput | Date | string
    company_id?: StringFieldUpdateOperationsInput | string
    metadata?: JsonNullValueInput | InputJsonValue
    created_at?: DateTimeFieldUpdateOperationsInput | Date | string
    updated_at?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type TicketUpdateWithoutAssigned_userInput = {
    id?: StringFieldUpdateOperationsInput | string
    ticket_number?: StringFieldUpdateOperationsInput | string
    title?: StringFieldUpdateOperationsInput | string
    description?: NullableStringFieldUpdateOperationsInput | string | null
    status?: StringFieldUpdateOperationsInput | string
    priority?: StringFieldUpdateOperationsInput | string
    form_data?: JsonNullValueInput | InputJsonValue
    created_at?: DateTimeFieldUpdateOperationsInput | Date | string
    updated_at?: DateTimeFieldUpdateOperationsInput | Date | string
    conversation?: ConversationUpdateOneRequiredWithoutTicketsNestedInput
    company?: CompanyUpdateOneRequiredWithoutTicketsNestedInput
  }

  export type TicketUncheckedUpdateWithoutAssigned_userInput = {
    id?: StringFieldUpdateOperationsInput | string
    ticket_number?: StringFieldUpdateOperationsInput | string
    conversation_id?: StringFieldUpdateOperationsInput | string
    title?: StringFieldUpdateOperationsInput | string
    description?: NullableStringFieldUpdateOperationsInput | string | null
    status?: StringFieldUpdateOperationsInput | string
    priority?: StringFieldUpdateOperationsInput | string
    form_data?: JsonNullValueInput | InputJsonValue
    company_id?: StringFieldUpdateOperationsInput | string
    created_at?: DateTimeFieldUpdateOperationsInput | Date | string
    updated_at?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type TicketUncheckedUpdateManyWithoutAssigned_userInput = {
    id?: StringFieldUpdateOperationsInput | string
    ticket_number?: StringFieldUpdateOperationsInput | string
    conversation_id?: StringFieldUpdateOperationsInput | string
    title?: StringFieldUpdateOperationsInput | string
    description?: NullableStringFieldUpdateOperationsInput | string | null
    status?: StringFieldUpdateOperationsInput | string
    priority?: StringFieldUpdateOperationsInput | string
    form_data?: JsonNullValueInput | InputJsonValue
    company_id?: StringFieldUpdateOperationsInput | string
    created_at?: DateTimeFieldUpdateOperationsInput | Date | string
    updated_at?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type ConversationCreateManyChannelInput = {
    id?: string
    contact_id: string
    bot_id?: string | null
    status?: string
    assigned_to?: string | null
    last_message_at?: Date | string
    company_id: string
    metadata?: JsonNullValueInput | InputJsonValue
    created_at?: Date | string
    updated_at?: Date | string
  }

  export type ChannelBotCreateManyChannelInput = {
    id?: string
    bot_id: string
    is_active?: boolean
    trigger_conditions?: JsonNullValueInput | InputJsonValue
    created_at?: Date | string
  }

  export type WebhookEventCreateManyChannelInput = {
    id?: string
    event_type: string
    payload?: JsonNullValueInput | InputJsonValue
    processed?: boolean
    processing_error?: string | null
    created_at?: Date | string
  }

  export type ConversationUpdateWithoutChannelInput = {
    id?: StringFieldUpdateOperationsInput | string
    status?: StringFieldUpdateOperationsInput | string
    last_message_at?: DateTimeFieldUpdateOperationsInput | Date | string
    metadata?: JsonNullValueInput | InputJsonValue
    created_at?: DateTimeFieldUpdateOperationsInput | Date | string
    updated_at?: DateTimeFieldUpdateOperationsInput | Date | string
    contact?: ContactUpdateOneRequiredWithoutConversationsNestedInput
    bot?: BotUpdateOneWithoutConversationsNestedInput
    assigned_user?: UserUpdateOneWithoutAssigned_conversationsNestedInput
    company?: CompanyUpdateOneRequiredWithoutConversationsNestedInput
    messages?: MessageUpdateManyWithoutConversationNestedInput
    tickets?: TicketUpdateManyWithoutConversationNestedInput
  }

  export type ConversationUncheckedUpdateWithoutChannelInput = {
    id?: StringFieldUpdateOperationsInput | string
    contact_id?: StringFieldUpdateOperationsInput | string
    bot_id?: NullableStringFieldUpdateOperationsInput | string | null
    status?: StringFieldUpdateOperationsInput | string
    assigned_to?: NullableStringFieldUpdateOperationsInput | string | null
    last_message_at?: DateTimeFieldUpdateOperationsInput | Date | string
    company_id?: StringFieldUpdateOperationsInput | string
    metadata?: JsonNullValueInput | InputJsonValue
    created_at?: DateTimeFieldUpdateOperationsInput | Date | string
    updated_at?: DateTimeFieldUpdateOperationsInput | Date | string
    messages?: MessageUncheckedUpdateManyWithoutConversationNestedInput
    tickets?: TicketUncheckedUpdateManyWithoutConversationNestedInput
  }

  export type ConversationUncheckedUpdateManyWithoutChannelInput = {
    id?: StringFieldUpdateOperationsInput | string
    contact_id?: StringFieldUpdateOperationsInput | string
    bot_id?: NullableStringFieldUpdateOperationsInput | string | null
    status?: StringFieldUpdateOperationsInput | string
    assigned_to?: NullableStringFieldUpdateOperationsInput | string | null
    last_message_at?: DateTimeFieldUpdateOperationsInput | Date | string
    company_id?: StringFieldUpdateOperationsInput | string
    metadata?: JsonNullValueInput | InputJsonValue
    created_at?: DateTimeFieldUpdateOperationsInput | Date | string
    updated_at?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type ChannelBotUpdateWithoutChannelInput = {
    id?: StringFieldUpdateOperationsInput | string
    is_active?: BoolFieldUpdateOperationsInput | boolean
    trigger_conditions?: JsonNullValueInput | InputJsonValue
    created_at?: DateTimeFieldUpdateOperationsInput | Date | string
    bot?: BotUpdateOneRequiredWithoutChannel_botsNestedInput
  }

  export type ChannelBotUncheckedUpdateWithoutChannelInput = {
    id?: StringFieldUpdateOperationsInput | string
    bot_id?: StringFieldUpdateOperationsInput | string
    is_active?: BoolFieldUpdateOperationsInput | boolean
    trigger_conditions?: JsonNullValueInput | InputJsonValue
    created_at?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type ChannelBotUncheckedUpdateManyWithoutChannelInput = {
    id?: StringFieldUpdateOperationsInput | string
    bot_id?: StringFieldUpdateOperationsInput | string
    is_active?: BoolFieldUpdateOperationsInput | boolean
    trigger_conditions?: JsonNullValueInput | InputJsonValue
    created_at?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type WebhookEventUpdateWithoutChannelInput = {
    id?: StringFieldUpdateOperationsInput | string
    event_type?: StringFieldUpdateOperationsInput | string
    payload?: JsonNullValueInput | InputJsonValue
    processed?: BoolFieldUpdateOperationsInput | boolean
    processing_error?: NullableStringFieldUpdateOperationsInput | string | null
    created_at?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type WebhookEventUncheckedUpdateWithoutChannelInput = {
    id?: StringFieldUpdateOperationsInput | string
    event_type?: StringFieldUpdateOperationsInput | string
    payload?: JsonNullValueInput | InputJsonValue
    processed?: BoolFieldUpdateOperationsInput | boolean
    processing_error?: NullableStringFieldUpdateOperationsInput | string | null
    created_at?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type WebhookEventUncheckedUpdateManyWithoutChannelInput = {
    id?: StringFieldUpdateOperationsInput | string
    event_type?: StringFieldUpdateOperationsInput | string
    payload?: JsonNullValueInput | InputJsonValue
    processed?: BoolFieldUpdateOperationsInput | boolean
    processing_error?: NullableStringFieldUpdateOperationsInput | string | null
    created_at?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type ConversationCreateManyBotInput = {
    id?: string
    contact_id: string
    channel_id: string
    status?: string
    assigned_to?: string | null
    last_message_at?: Date | string
    company_id: string
    metadata?: JsonNullValueInput | InputJsonValue
    created_at?: Date | string
    updated_at?: Date | string
  }

  export type ChannelBotCreateManyBotInput = {
    id?: string
    channel_id: string
    is_active?: boolean
    trigger_conditions?: JsonNullValueInput | InputJsonValue
    created_at?: Date | string
  }

  export type ConversationUpdateWithoutBotInput = {
    id?: StringFieldUpdateOperationsInput | string
    status?: StringFieldUpdateOperationsInput | string
    last_message_at?: DateTimeFieldUpdateOperationsInput | Date | string
    metadata?: JsonNullValueInput | InputJsonValue
    created_at?: DateTimeFieldUpdateOperationsInput | Date | string
    updated_at?: DateTimeFieldUpdateOperationsInput | Date | string
    contact?: ContactUpdateOneRequiredWithoutConversationsNestedInput
    channel?: ChannelUpdateOneRequiredWithoutConversationsNestedInput
    assigned_user?: UserUpdateOneWithoutAssigned_conversationsNestedInput
    company?: CompanyUpdateOneRequiredWithoutConversationsNestedInput
    messages?: MessageUpdateManyWithoutConversationNestedInput
    tickets?: TicketUpdateManyWithoutConversationNestedInput
  }

  export type ConversationUncheckedUpdateWithoutBotInput = {
    id?: StringFieldUpdateOperationsInput | string
    contact_id?: StringFieldUpdateOperationsInput | string
    channel_id?: StringFieldUpdateOperationsInput | string
    status?: StringFieldUpdateOperationsInput | string
    assigned_to?: NullableStringFieldUpdateOperationsInput | string | null
    last_message_at?: DateTimeFieldUpdateOperationsInput | Date | string
    company_id?: StringFieldUpdateOperationsInput | string
    metadata?: JsonNullValueInput | InputJsonValue
    created_at?: DateTimeFieldUpdateOperationsInput | Date | string
    updated_at?: DateTimeFieldUpdateOperationsInput | Date | string
    messages?: MessageUncheckedUpdateManyWithoutConversationNestedInput
    tickets?: TicketUncheckedUpdateManyWithoutConversationNestedInput
  }

  export type ConversationUncheckedUpdateManyWithoutBotInput = {
    id?: StringFieldUpdateOperationsInput | string
    contact_id?: StringFieldUpdateOperationsInput | string
    channel_id?: StringFieldUpdateOperationsInput | string
    status?: StringFieldUpdateOperationsInput | string
    assigned_to?: NullableStringFieldUpdateOperationsInput | string | null
    last_message_at?: DateTimeFieldUpdateOperationsInput | Date | string
    company_id?: StringFieldUpdateOperationsInput | string
    metadata?: JsonNullValueInput | InputJsonValue
    created_at?: DateTimeFieldUpdateOperationsInput | Date | string
    updated_at?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type ChannelBotUpdateWithoutBotInput = {
    id?: StringFieldUpdateOperationsInput | string
    is_active?: BoolFieldUpdateOperationsInput | boolean
    trigger_conditions?: JsonNullValueInput | InputJsonValue
    created_at?: DateTimeFieldUpdateOperationsInput | Date | string
    channel?: ChannelUpdateOneRequiredWithoutChannel_botsNestedInput
  }

  export type ChannelBotUncheckedUpdateWithoutBotInput = {
    id?: StringFieldUpdateOperationsInput | string
    channel_id?: StringFieldUpdateOperationsInput | string
    is_active?: BoolFieldUpdateOperationsInput | boolean
    trigger_conditions?: JsonNullValueInput | InputJsonValue
    created_at?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type ChannelBotUncheckedUpdateManyWithoutBotInput = {
    id?: StringFieldUpdateOperationsInput | string
    channel_id?: StringFieldUpdateOperationsInput | string
    is_active?: BoolFieldUpdateOperationsInput | boolean
    trigger_conditions?: JsonNullValueInput | InputJsonValue
    created_at?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type ConversationCreateManyContactInput = {
    id?: string
    channel_id: string
    bot_id?: string | null
    status?: string
    assigned_to?: string | null
    last_message_at?: Date | string
    company_id: string
    metadata?: JsonNullValueInput | InputJsonValue
    created_at?: Date | string
    updated_at?: Date | string
  }

  export type ConversationUpdateWithoutContactInput = {
    id?: StringFieldUpdateOperationsInput | string
    status?: StringFieldUpdateOperationsInput | string
    last_message_at?: DateTimeFieldUpdateOperationsInput | Date | string
    metadata?: JsonNullValueInput | InputJsonValue
    created_at?: DateTimeFieldUpdateOperationsInput | Date | string
    updated_at?: DateTimeFieldUpdateOperationsInput | Date | string
    channel?: ChannelUpdateOneRequiredWithoutConversationsNestedInput
    bot?: BotUpdateOneWithoutConversationsNestedInput
    assigned_user?: UserUpdateOneWithoutAssigned_conversationsNestedInput
    company?: CompanyUpdateOneRequiredWithoutConversationsNestedInput
    messages?: MessageUpdateManyWithoutConversationNestedInput
    tickets?: TicketUpdateManyWithoutConversationNestedInput
  }

  export type ConversationUncheckedUpdateWithoutContactInput = {
    id?: StringFieldUpdateOperationsInput | string
    channel_id?: StringFieldUpdateOperationsInput | string
    bot_id?: NullableStringFieldUpdateOperationsInput | string | null
    status?: StringFieldUpdateOperationsInput | string
    assigned_to?: NullableStringFieldUpdateOperationsInput | string | null
    last_message_at?: DateTimeFieldUpdateOperationsInput | Date | string
    company_id?: StringFieldUpdateOperationsInput | string
    metadata?: JsonNullValueInput | InputJsonValue
    created_at?: DateTimeFieldUpdateOperationsInput | Date | string
    updated_at?: DateTimeFieldUpdateOperationsInput | Date | string
    messages?: MessageUncheckedUpdateManyWithoutConversationNestedInput
    tickets?: TicketUncheckedUpdateManyWithoutConversationNestedInput
  }

  export type ConversationUncheckedUpdateManyWithoutContactInput = {
    id?: StringFieldUpdateOperationsInput | string
    channel_id?: StringFieldUpdateOperationsInput | string
    bot_id?: NullableStringFieldUpdateOperationsInput | string | null
    status?: StringFieldUpdateOperationsInput | string
    assigned_to?: NullableStringFieldUpdateOperationsInput | string | null
    last_message_at?: DateTimeFieldUpdateOperationsInput | Date | string
    company_id?: StringFieldUpdateOperationsInput | string
    metadata?: JsonNullValueInput | InputJsonValue
    created_at?: DateTimeFieldUpdateOperationsInput | Date | string
    updated_at?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type MessageCreateManyConversationInput = {
    id?: string
    content: string
    message_type?: string
    sender_type: string
    sender_id?: string | null
    external_id?: string | null
    metadata?: JsonNullValueInput | InputJsonValue
    created_at?: Date | string
  }

  export type TicketCreateManyConversationInput = {
    id?: string
    ticket_number: string
    title: string
    description?: string | null
    status?: string
    priority?: string
    assigned_to?: string | null
    form_data?: JsonNullValueInput | InputJsonValue
    company_id: string
    created_at?: Date | string
    updated_at?: Date | string
  }

  export type MessageUpdateWithoutConversationInput = {
    id?: StringFieldUpdateOperationsInput | string
    content?: StringFieldUpdateOperationsInput | string
    message_type?: StringFieldUpdateOperationsInput | string
    sender_type?: StringFieldUpdateOperationsInput | string
    sender_id?: NullableStringFieldUpdateOperationsInput | string | null
    external_id?: NullableStringFieldUpdateOperationsInput | string | null
    metadata?: JsonNullValueInput | InputJsonValue
    created_at?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type MessageUncheckedUpdateWithoutConversationInput = {
    id?: StringFieldUpdateOperationsInput | string
    content?: StringFieldUpdateOperationsInput | string
    message_type?: StringFieldUpdateOperationsInput | string
    sender_type?: StringFieldUpdateOperationsInput | string
    sender_id?: NullableStringFieldUpdateOperationsInput | string | null
    external_id?: NullableStringFieldUpdateOperationsInput | string | null
    metadata?: JsonNullValueInput | InputJsonValue
    created_at?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type MessageUncheckedUpdateManyWithoutConversationInput = {
    id?: StringFieldUpdateOperationsInput | string
    content?: StringFieldUpdateOperationsInput | string
    message_type?: StringFieldUpdateOperationsInput | string
    sender_type?: StringFieldUpdateOperationsInput | string
    sender_id?: NullableStringFieldUpdateOperationsInput | string | null
    external_id?: NullableStringFieldUpdateOperationsInput | string | null
    metadata?: JsonNullValueInput | InputJsonValue
    created_at?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type TicketUpdateWithoutConversationInput = {
    id?: StringFieldUpdateOperationsInput | string
    ticket_number?: StringFieldUpdateOperationsInput | string
    title?: StringFieldUpdateOperationsInput | string
    description?: NullableStringFieldUpdateOperationsInput | string | null
    status?: StringFieldUpdateOperationsInput | string
    priority?: StringFieldUpdateOperationsInput | string
    form_data?: JsonNullValueInput | InputJsonValue
    created_at?: DateTimeFieldUpdateOperationsInput | Date | string
    updated_at?: DateTimeFieldUpdateOperationsInput | Date | string
    assigned_user?: UserUpdateOneWithoutAssigned_ticketsNestedInput
    company?: CompanyUpdateOneRequiredWithoutTicketsNestedInput
  }

  export type TicketUncheckedUpdateWithoutConversationInput = {
    id?: StringFieldUpdateOperationsInput | string
    ticket_number?: StringFieldUpdateOperationsInput | string
    title?: StringFieldUpdateOperationsInput | string
    description?: NullableStringFieldUpdateOperationsInput | string | null
    status?: StringFieldUpdateOperationsInput | string
    priority?: StringFieldUpdateOperationsInput | string
    assigned_to?: NullableStringFieldUpdateOperationsInput | string | null
    form_data?: JsonNullValueInput | InputJsonValue
    company_id?: StringFieldUpdateOperationsInput | string
    created_at?: DateTimeFieldUpdateOperationsInput | Date | string
    updated_at?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type TicketUncheckedUpdateManyWithoutConversationInput = {
    id?: StringFieldUpdateOperationsInput | string
    ticket_number?: StringFieldUpdateOperationsInput | string
    title?: StringFieldUpdateOperationsInput | string
    description?: NullableStringFieldUpdateOperationsInput | string | null
    status?: StringFieldUpdateOperationsInput | string
    priority?: StringFieldUpdateOperationsInput | string
    assigned_to?: NullableStringFieldUpdateOperationsInput | string | null
    form_data?: JsonNullValueInput | InputJsonValue
    company_id?: StringFieldUpdateOperationsInput | string
    created_at?: DateTimeFieldUpdateOperationsInput | Date | string
    updated_at?: DateTimeFieldUpdateOperationsInput | Date | string
  }



  /**
   * Aliases for legacy arg types
   */
    /**
     * @deprecated Use CompanyCountOutputTypeDefaultArgs instead
     */
    export type CompanyCountOutputTypeArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = CompanyCountOutputTypeDefaultArgs<ExtArgs>
    /**
     * @deprecated Use UserCountOutputTypeDefaultArgs instead
     */
    export type UserCountOutputTypeArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = UserCountOutputTypeDefaultArgs<ExtArgs>
    /**
     * @deprecated Use ChannelCountOutputTypeDefaultArgs instead
     */
    export type ChannelCountOutputTypeArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = ChannelCountOutputTypeDefaultArgs<ExtArgs>
    /**
     * @deprecated Use BotCountOutputTypeDefaultArgs instead
     */
    export type BotCountOutputTypeArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = BotCountOutputTypeDefaultArgs<ExtArgs>
    /**
     * @deprecated Use ContactCountOutputTypeDefaultArgs instead
     */
    export type ContactCountOutputTypeArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = ContactCountOutputTypeDefaultArgs<ExtArgs>
    /**
     * @deprecated Use ConversationCountOutputTypeDefaultArgs instead
     */
    export type ConversationCountOutputTypeArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = ConversationCountOutputTypeDefaultArgs<ExtArgs>
    /**
     * @deprecated Use CompanyDefaultArgs instead
     */
    export type CompanyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = CompanyDefaultArgs<ExtArgs>
    /**
     * @deprecated Use UserDefaultArgs instead
     */
    export type UserArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = UserDefaultArgs<ExtArgs>
    /**
     * @deprecated Use ChannelDefaultArgs instead
     */
    export type ChannelArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = ChannelDefaultArgs<ExtArgs>
    /**
     * @deprecated Use BotDefaultArgs instead
     */
    export type BotArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = BotDefaultArgs<ExtArgs>
    /**
     * @deprecated Use ChannelBotDefaultArgs instead
     */
    export type ChannelBotArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = ChannelBotDefaultArgs<ExtArgs>
    /**
     * @deprecated Use ContactDefaultArgs instead
     */
    export type ContactArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = ContactDefaultArgs<ExtArgs>
    /**
     * @deprecated Use ConversationDefaultArgs instead
     */
    export type ConversationArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = ConversationDefaultArgs<ExtArgs>
    /**
     * @deprecated Use MessageDefaultArgs instead
     */
    export type MessageArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = MessageDefaultArgs<ExtArgs>
    /**
     * @deprecated Use TicketDefaultArgs instead
     */
    export type TicketArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = TicketDefaultArgs<ExtArgs>
    /**
     * @deprecated Use WebhookEventDefaultArgs instead
     */
    export type WebhookEventArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = WebhookEventDefaultArgs<ExtArgs>

  /**
   * Batch Payload for updateMany & deleteMany & createMany
   */

  export type BatchPayload = {
    count: number
  }

  /**
   * DMMF
   */
  export const dmmf: runtime.BaseDMMF
}
import { neon } from '@neondatabase/serverless';
import {
  Decimal,
  User,
  Canteen,
  Category,
  InventoryRecord,
  MenuItem,
  NotificationLog,
  Order,
  OrderItem,
  OrderStatusHistory,
  PasswordResetToken,
  Payment,
  PickupSlot,
  Promotion,
  PromotionClick,
  PromotionImpression,
  StaffAssignment,
  UserPreference,
  AuditLog,
  NeonClient,
} from '@/types/database';
import crypto from 'crypto';

function getDatabaseUrl(): string {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error('DATABASE_URL environment variable is not defined for Neon database connection.');
  }
  return url;
}

// Neon query executor
export function getSql(): ((query: string, params?: any[]) => Promise<any[]>) {
  const client = neon(getDatabaseUrl());
  return async (query: string, params?: any[]) => {
    return (await client.query(query, params || [])) as any[];
  };
}

function parseRow(row: any, tableName: string) {
  if (!row) return row;
  const copy = { ...row };

  // Convert string numeric columns to Decimal or numbers as needed
  const decimalCols: Record<string, string[]> = {
    Order: ['subtotal', 'tax', 'convenienceFee', 'total', 'discount'],
    OrderItem: ['unitPriceSnapshot', 'subtotal'],
    MenuItem: ['price'],
    Payment: ['amount'],
    Promotion: ['discountValue', 'maxDiscount', 'minOrderValue'],
  };

  const cols = decimalCols[tableName];
  if (cols) {
    for (const c of cols) {
      if (copy[c] !== undefined && copy[c] !== null) {
        copy[c] = new Decimal(copy[c]);
      }
    }
  }

  // Ensure dates are parsed as JavaScript Date instances
  const dateCols = [
    'createdAt',
    'updatedAt',
    'startDate',
    'endDate',
    'expiresAt',
    'trackingTokenExpiresAt',
    'paymentCollectionConfirmedAt',
    'pickupVerifiedAt',
    'verifiedAt',
  ];

  for (const dc of dateCols) {
    if (copy[dc] && !(copy[dc] instanceof Date)) {
      copy[dc] = new Date(copy[dc]);
    }
  }

  return copy;
}

function buildWhere(where: Record<string, any> | undefined, params: any[]): string {
  if (!where || Object.keys(where).length === 0) return '';
  const conditions: string[] = [];

  for (const [key, val] of Object.entries(where)) {
    if (val === undefined) continue;

    if (key === 'OR' && Array.isArray(val)) {
      const orClauses = val
        .map((subWhere) => {
          const clause = buildWhere(subWhere, params);
          return clause ? clause.replace(/^WHERE\s+/, '') : '';
        })
        .filter(Boolean);
      if (orClauses.length > 0) {
        conditions.push(`(${orClauses.join(' OR ')})`);
      }
      continue;
    }

    if (key === 'AND' && Array.isArray(val)) {
      const andClauses = val
        .map((subWhere) => {
          const clause = buildWhere(subWhere, params);
          return clause ? clause.replace(/^WHERE\s+/, '') : '';
        })
        .filter(Boolean);
      if (andClauses.length > 0) {
        conditions.push(`(${andClauses.join(' AND ')})`);
      }
      continue;
    }

    if (val === null) {
      conditions.push(`"${key}" IS NULL`);
      continue;
    }

    if (typeof val === 'object' && !(val instanceof Date)) {
      if ('in' in val && Array.isArray(val.in)) {
        params.push(val.in);
        conditions.push(`"${key}" = ANY($${params.length})`);
      } else if ('notIn' in val && Array.isArray(val.notIn)) {
        params.push(val.notIn);
        conditions.push(`NOT ("${key}" = ANY($${params.length}))`);
      } else if ('not' in val) {
        if (val.not === null) {
          conditions.push(`"${key}" IS NOT NULL`);
        } else {
          params.push(val.not);
          conditions.push(`"${key}" != $${params.length}`);
        }
      } else {
        if ('gte' in val) {
          params.push(val.gte);
          conditions.push(`"${key}" >= $${params.length}`);
        }
        if ('lte' in val) {
          params.push(val.lte);
          conditions.push(`"${key}" <= $${params.length}`);
        }
        if ('gt' in val) {
          params.push(val.gt);
          conditions.push(`"${key}" > $${params.length}`);
        }
        if ('lt' in val) {
          params.push(val.lt);
          conditions.push(`"${key}" < $${params.length}`);
        }
        if ('contains' in val) {
          const mode = val.mode === 'insensitive' ? 'ILIKE' : 'LIKE';
          params.push(`%${val.contains}%`);
          conditions.push(`"${key}" ${mode} $${params.length}`);
        }
      }
    } else {
      params.push(val);
      conditions.push(`"${key}" = $${params.length}`);
    }
  }

  return conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
}

function buildOrderBy(orderBy: any): string {
  if (!orderBy) return '';
  if (Array.isArray(orderBy)) {
    return (
      'ORDER BY ' +
      orderBy
        .map((item) => {
          const [col, dir] = Object.entries(item)[0];
          return `"${col}" ${String(dir).toUpperCase()}`;
        })
        .join(', ')
    );
  }
  const [col, dir] = Object.entries(orderBy)[0];
  return `ORDER BY "${col}" ${String(dir).toUpperCase()}`;
}

async function attachRelations(tableName: string, rows: any[], include?: Record<string, any>) {
  if (!include || rows.length === 0) return rows;
  const sql = getSql();

  if (tableName === 'Order') {
    const orderIds = rows.map((r) => r.id);
    const canteenIds = Array.from(new Set(rows.map((r) => r.canteenId).filter(Boolean)));
    const customerIds = Array.from(new Set(rows.map((r) => r.customerId).filter(Boolean)));
    const pickupSlotIds = Array.from(new Set(rows.map((r) => r.pickupSlotId).filter(Boolean)));

    if (include.canteen && canteenIds.length > 0) {
      const canteens = await sql('SELECT * FROM "Canteen" WHERE "id" = ANY($1)', [canteenIds]);
      const canteenMap = new Map(canteens.map((c) => [c.id, parseRow(c, 'Canteen')]));
      rows.forEach((r) => (r.canteen = canteenMap.get(r.canteenId) || null));
    }

    if (include.customer && customerIds.length > 0) {
      const customers = await sql('SELECT * FROM "User" WHERE "id" = ANY($1)', [customerIds]);
      const custMap = new Map(customers.map((u) => [u.id, parseRow(u, 'User')]));
      rows.forEach((r) => (r.customer = custMap.get(r.customerId) || null));
    }

    if (include.pickupSlot && pickupSlotIds.length > 0) {
      const slots = await sql('SELECT * FROM "PickupSlot" WHERE "id" = ANY($1)', [pickupSlotIds]);
      const slotMap = new Map(slots.map((s) => [s.id, parseRow(s, 'PickupSlot')]));
      rows.forEach((r) => (r.pickupSlot = slotMap.get(r.pickupSlotId) || null));
    }

    if (include.payment) {
      const payments = await sql('SELECT * FROM "Payment" WHERE "orderId" = ANY($1)', [orderIds]);
      const payMap = new Map(payments.map((p) => [p.orderId, parseRow(p, 'Payment')]));
      rows.forEach((r) => (r.payment = payMap.get(r.id) || null));
    }

    if (include.statusHistory) {
      const histories = await sql('SELECT * FROM "OrderStatusHistory" WHERE "orderId" = ANY($1) ORDER BY "createdAt" ASC', [orderIds]);
      const histMap = new Map<string, any[]>();
      histories.forEach((h) => {
        if (!histMap.has(h.orderId)) histMap.set(h.orderId, []);
        histMap.get(h.orderId)!.push(parseRow(h, 'OrderStatusHistory'));
      });
      rows.forEach((r) => (r.statusHistory = histMap.get(r.id) || []));
    }

    if (include.items) {
      const items = await sql('SELECT * FROM "OrderItem" WHERE "orderId" = ANY($1)', [orderIds]);
      const parsedItems = items.map((i) => parseRow(i, 'OrderItem'));

      if (typeof include.items === 'object' && include.items.include?.menuItem) {
        const menuItemIds = Array.from(new Set(parsedItems.map((i) => i.menuItemId).filter(Boolean)));
        if (menuItemIds.length > 0) {
          const menuItems = await sql('SELECT * FROM "MenuItem" WHERE "id" = ANY($1)', [menuItemIds]);
          const menuMap = new Map(menuItems.map((m) => [m.id, parseRow(m, 'MenuItem')]));
          parsedItems.forEach((i) => (i.menuItem = menuMap.get(i.menuItemId) || null));
        }
      }

      const itemMap = new Map<string, any[]>();
      parsedItems.forEach((i) => {
        if (!itemMap.has(i.orderId)) itemMap.set(i.orderId, []);
        itemMap.get(i.orderId)!.push(i);
      });
      rows.forEach((r) => (r.items = itemMap.get(r.id) || []));
    }
  }

  if (tableName === 'MenuItem') {
    const itemIds = rows.map((r) => r.id);
    const canteenIds = Array.from(new Set(rows.map((r) => r.canteenId).filter(Boolean)));
    const categoryIds = Array.from(new Set(rows.map((r) => r.categoryId).filter(Boolean)));

    if (include.canteen && canteenIds.length > 0) {
      const canteens = await sql('SELECT * FROM "Canteen" WHERE "id" = ANY($1)', [canteenIds]);
      const canteenMap = new Map(canteens.map((c) => [c.id, parseRow(c, 'Canteen')]));
      rows.forEach((r) => (r.canteen = canteenMap.get(r.canteenId) || null));
    }

    if (include.category && categoryIds.length > 0) {
      const categories = await sql('SELECT * FROM "Category" WHERE "id" = ANY($1)', [categoryIds]);
      const catMap = new Map(categories.map((c) => [c.id, parseRow(c, 'Category')]));
      rows.forEach((r) => (r.category = catMap.get(r.categoryId) || null));
    }

    if (include.inventory) {
      const inventories = await sql('SELECT * FROM "InventoryRecord" WHERE "menuItemId" = ANY($1)', [itemIds]);
      const invMap = new Map(inventories.map((i) => [i.menuItemId, parseRow(i, 'InventoryRecord')]));
      rows.forEach((r) => (r.inventory = invMap.get(r.id) || null));
    }
  }

  if (tableName === 'Canteen') {
    const canteenIds = rows.map((r) => r.id);

    if (include.categories) {
      const categories = await sql('SELECT * FROM "Category" WHERE "canteenId" = ANY($1) ORDER BY "sortOrder" ASC', [canteenIds]);
      const parsedCategories = categories.map((c) => parseRow(c, 'Category'));

      if (typeof include.categories === 'object' && include.categories.include?.menuItems) {
        const catIds = parsedCategories.map((c) => c.id);
        if (catIds.length > 0) {
          const menuItems = await sql('SELECT * FROM "MenuItem" WHERE "categoryId" = ANY($1) AND "isAvailable" = true', [catIds]);
          const parsedItems = menuItems.map((m) => parseRow(m, 'MenuItem'));
          if (include.categories.include.menuItems.include?.inventory) {
            const itemIds = parsedItems.map((i) => i.id);
            if (itemIds.length > 0) {
              const inventories = await sql('SELECT * FROM "InventoryRecord" WHERE "menuItemId" = ANY($1)', [itemIds]);
              const invMap = new Map(inventories.map((i) => [i.menuItemId, parseRow(i, 'InventoryRecord')]));
              parsedItems.forEach((i) => (i.inventory = invMap.get(i.id) || null));
            }
          }
          const itemMap = new Map<string, any[]>();
          parsedItems.forEach((i) => {
            if (!itemMap.has(i.categoryId)) itemMap.set(i.categoryId, []);
            itemMap.get(i.categoryId)!.push(i);
          });
          parsedCategories.forEach((c) => (c.menuItems = itemMap.get(c.id) || []));
        }
      }

      const catMap = new Map<string, any[]>();
      parsedCategories.forEach((c) => {
        if (!catMap.has(c.canteenId)) catMap.set(c.canteenId, []);
        catMap.get(c.canteenId)!.push(c);
      });
      rows.forEach((r) => (r.categories = catMap.get(r.id) || []));
    }

    if (include.pickupSlots) {
      const slots = await sql('SELECT * FROM "PickupSlot" WHERE "canteenId" = ANY($1) AND "isActive" = true ORDER BY "startTime" ASC', [canteenIds]);
      const slotMap = new Map<string, any[]>();
      slots.forEach((s) => {
        if (!slotMap.has(s.canteenId)) slotMap.set(s.canteenId, []);
        slotMap.get(s.canteenId)!.push(parseRow(s, 'PickupSlot'));
      });
      rows.forEach((r) => (r.pickupSlots = slotMap.get(r.id) || []));
    }

    if (include._count) {
      const counts = await sql('SELECT "canteenId", COUNT(*)::int as count FROM "MenuItem" WHERE "canteenId" = ANY($1) GROUP BY "canteenId"', [canteenIds]);
      const countMap = new Map(counts.map((c) => [c.canteenId, c.count]));
      rows.forEach((r) => (r._count = { menuItems: countMap.get(r.id) || 0 }));
    }
  }

  if (tableName === 'Category') {
    const categoryIds = rows.map((r) => r.id);
    if (include._count) {
      const counts = await sql('SELECT "categoryId", COUNT(*)::int as count FROM "MenuItem" WHERE "categoryId" = ANY($1) GROUP BY "categoryId"', [categoryIds]);
      const countMap = new Map(counts.map((c) => [c.categoryId, c.count]));
      rows.forEach((r) => (r._count = { menuItems: countMap.get(r.id) || 0 }));
    }
    if (include.menuItems) {
      const menuItems = await sql('SELECT * FROM "MenuItem" WHERE "categoryId" = ANY($1)', [categoryIds]);
      const itemMap = new Map<string, any[]>();
      menuItems.forEach((m) => {
        if (!itemMap.has(m.categoryId)) itemMap.set(m.categoryId, []);
        itemMap.get(m.categoryId)!.push(parseRow(m, 'MenuItem'));
      });
      rows.forEach((r) => (r.menuItems = itemMap.get(r.id) || []));
    }
  }

  if (tableName === 'User') {
    const userIds = rows.map((u) => u.id);
    rows.forEach((u) => {
      if (!u.staffAssignments) u.staffAssignments = [];
    });
    if (include.staffAssignments) {
      const assignments = await sql('SELECT * FROM "StaffAssignment" WHERE "userId" = ANY($1)', [userIds]);
      const parsedAssignments = assignments.map((a) => parseRow(a, 'StaffAssignment'));

      if (
        typeof include.staffAssignments === 'object' &&
        (include.staffAssignments.include?.canteen || include.staffAssignments.select?.canteen)
      ) {
        const cIds = Array.from(new Set(parsedAssignments.map((a) => a.canteenId).filter(Boolean)));
        if (cIds.length > 0) {
          const canteens = await sql('SELECT * FROM "Canteen" WHERE "id" = ANY($1)', [cIds]);
          const canteenMap = new Map(canteens.map((c) => [c.id, parseRow(c, 'Canteen')]));
          parsedAssignments.forEach((a) => (a.canteen = canteenMap.get(a.canteenId) || null));
        }
      }

      const assignMap = new Map<string, any[]>();
      parsedAssignments.forEach((a) => {
        if (!assignMap.has(a.userId)) assignMap.set(a.userId, []);
        assignMap.get(a.userId)!.push(a);
      });
      rows.forEach((u) => (u.staffAssignments = assignMap.get(u.id) || []));
    }
  }

  if (tableName === 'StaffAssignment') {
    const canteenIds = Array.from(new Set(rows.map((r) => r.canteenId).filter(Boolean)));
    const userIds = Array.from(new Set(rows.map((r) => r.userId).filter(Boolean)));

    if (include.canteen && canteenIds.length > 0) {
      const canteens = await sql('SELECT * FROM "Canteen" WHERE "id" = ANY($1)', [canteenIds]);
      const cMap = new Map(canteens.map((c) => [c.id, parseRow(c, 'Canteen')]));
      rows.forEach((r) => (r.canteen = cMap.get(r.canteenId) || null));
    }
    if (include.user && userIds.length > 0) {
      const users = await sql('SELECT * FROM "User" WHERE "id" = ANY($1)', [userIds]);
      const uMap = new Map(users.map((u) => [u.id, parseRow(u, 'User')]));
      rows.forEach((r) => (r.user = uMap.get(r.userId) || null));
    }
  }

  return rows;
}

function createModelHandler<T = any>(tableName: string) {
  return {
    async findUnique(args: { where: Record<string, any>; include?: any; select?: any }): Promise<T | null> {
      const sql = getSql();
      const params: any[] = [];
      const whereClause = buildWhere(args.where, params);
      const query = `SELECT * FROM "${tableName}" ${whereClause} LIMIT 1`;
      const res = await sql(query, params);
      if (res.length === 0) return null;
      const parsed = [parseRow(res[0], tableName)];
      const rels = args.include || (args.select && typeof args.select === 'object' ? args.select : undefined);
      const withRelations = await attachRelations(tableName, parsed, rels);
      return withRelations[0] as T;
    },

    async findFirst(args?: { where?: Record<string, any>; include?: any; orderBy?: any; select?: any }): Promise<T | null> {
      const sql = getSql();
      const params: any[] = [];
      const whereClause = buildWhere(args?.where, params);
      const orderClause = buildOrderBy(args?.orderBy);
      const query = `SELECT * FROM "${tableName}" ${whereClause} ${orderClause} LIMIT 1`;
      const res = await sql(query, params);
      if (res.length === 0) return null;
      const parsed = [parseRow(res[0], tableName)];
      const rels = args?.include || (args?.select && typeof args?.select === 'object' ? args?.select : undefined);
      const withRelations = await attachRelations(tableName, parsed, rels);
      return withRelations[0] as T;
    },

    async findMany(args?: { where?: Record<string, any>; include?: any; orderBy?: any; take?: number; skip?: number; select?: any }): Promise<T[]> {
      const sql = getSql();
      const params: any[] = [];
      const whereClause = buildWhere(args?.where, params);
      const orderClause = buildOrderBy(args?.orderBy);
      let limitClause = '';
      if (args?.take !== undefined) {
        params.push(args.take);
        limitClause = `LIMIT $${params.length}`;
      }
      let offsetClause = '';
      if (args?.skip !== undefined) {
        params.push(args.skip);
        offsetClause = `OFFSET $${params.length}`;
      }
      const query = `SELECT * FROM "${tableName}" ${whereClause} ${orderClause} ${limitClause} ${offsetClause}`;
      const res = await sql(query, params);
      const parsed = res.map((r) => parseRow(r, tableName));
      const rels = args?.include || (args?.select && typeof args?.select === 'object' ? args?.select : undefined);
      return (await attachRelations(tableName, parsed, rels)) as T[];
    },

    async create(args: { data: Record<string, any>; include?: any }): Promise<T> {
      const sql = getSql();
      const data = { ...args.data };

      // Generate UUID if id is missing
      if (!data.id) {
        data.id = crypto.randomUUID();
      }

      // Handle nested creates if any
      const nestedCreates: Record<string, any> = {};
      for (const [k, v] of Object.entries(data)) {
        if (v && typeof v === 'object' && 'create' in v) {
          nestedCreates[k] = v.create;
          delete data[k];
        }
      }

      const cols = Object.keys(data).map((k) => `"${k}"`);
      const vals = Object.values(data);
      const placeholders = vals.map((_, i) => `$${i + 1}`);

      const query = `INSERT INTO "${tableName}" (${cols.join(', ')}) VALUES (${placeholders.join(', ')}) RETURNING *`;
      const res = await sql(query, vals);
      const created = parseRow(res[0], tableName);

      // Execute nested creates (e.g. order items, payment)
      if (tableName === 'Order') {
        if (nestedCreates.items && Array.isArray(nestedCreates.items)) {
          for (const item of nestedCreates.items) {
            await createModelHandler('OrderItem').create({
              data: { ...item, orderId: created.id },
            });
          }
        }
        if (nestedCreates.payment) {
          await createModelHandler('Payment').create({
            data: { ...nestedCreates.payment, orderId: created.id },
          });
        }
        if (nestedCreates.statusHistory) {
          await createModelHandler('OrderStatusHistory').create({
            data: { ...nestedCreates.statusHistory, orderId: created.id },
          });
        }
      }

      if (args.include) {
        const withRelations = await attachRelations(tableName, [created], args.include);
        return withRelations[0] as T;
      }

      return created as T;
    },

    async createMany(args: { data: Record<string, any>[] }) {
      const results: any[] = [];
      for (const d of args.data) {
        const item = await this.create({ data: d });
        results.push(item);
      }
      return { count: results.length };
    },

    async update(args: { where: Record<string, any>; data: Record<string, any>; include?: any }): Promise<T> {
      const sql = getSql();
      const data = { ...args.data };
      const setClauses: string[] = [];
      const params: any[] = [];

      // Auto update updatedAt if exists
      if (!('updatedAt' in data) && ['User', 'Canteen', 'Category', 'MenuItem', 'PickupSlot', 'Order', 'Payment', 'Promotion', 'UserPreference'].includes(tableName)) {
        data.updatedAt = new Date();
      }

      for (const [key, val] of Object.entries(data)) {
        if (val === undefined) continue;
        if (typeof val === 'object' && val !== null && !(val instanceof Date)) {
          if ('increment' in val) {
            params.push(val.increment);
            setClauses.push(`"${key}" = "${key}" + $${params.length}`);
            continue;
          }
          if ('decrement' in val) {
            params.push(val.decrement);
            setClauses.push(`"${key}" = "${key}" - $${params.length}`);
            continue;
          }
        }
        params.push(val);
        setClauses.push(`"${key}" = $${params.length}`);
      }

      const whereClause = buildWhere(args.where, params);
      const query = `UPDATE "${tableName}" SET ${setClauses.join(', ')} ${whereClause} RETURNING *`;
      const res = await sql(query, params);
      if (res.length === 0) return null as any;
      const updated = parseRow(res[0], tableName);

      if (args.include) {
        const withRelations = await attachRelations(tableName, [updated], args.include);
        return withRelations[0] as T;
      }

      return updated as T;
    },

    async updateMany(args: { where: Record<string, any>; data: Record<string, any> }) {
      const sql = getSql();
      const data = { ...args.data };
      const setClauses: string[] = [];
      const params: any[] = [];

      for (const [key, val] of Object.entries(data)) {
        if (val === undefined) continue;
        params.push(val);
        setClauses.push(`"${key}" = $${params.length}`);
      }

      const whereClause = buildWhere(args.where, params);
      const query = `UPDATE "${tableName}" SET ${setClauses.join(', ')} ${whereClause} RETURNING *`;
      const res = await sql(query, params);
      return { count: res.length };
    },

    async delete(args: { where: Record<string, any> }): Promise<T | null> {
      const sql = getSql();
      const params: any[] = [];
      const whereClause = buildWhere(args.where, params);
      const query = `DELETE FROM "${tableName}" ${whereClause} RETURNING *`;
      const res = await sql(query, params);
      return res.length > 0 ? (parseRow(res[0], tableName) as T) : null;
    },

    async deleteMany(args?: { where?: Record<string, any> }) {
      const sql = getSql();
      const params: any[] = [];
      const whereClause = buildWhere(args?.where, params);
      const query = `DELETE FROM "${tableName}" ${whereClause} RETURNING *`;
      const res = await sql(query, params);
      return { count: res.length };
    },

    async upsert(args: { where: Record<string, any>; create: Record<string, any>; update: Record<string, any> }): Promise<T> {
      const existing = await this.findFirst({ where: args.where });
      if (existing) {
        return await this.update({ where: args.where, data: args.update });
      } else {
        return await this.create({ data: { ...args.where, ...args.create } });
      }
    },

    async count(args?: { where?: Record<string, any> }): Promise<number> {
      const sql = getSql();
      const params: any[] = [];
      const whereClause = buildWhere(args?.where, params);
      const query = `SELECT COUNT(*)::int as count FROM "${tableName}" ${whereClause}`;
      const res = await sql(query, params);
      return res[0]?.count || 0;
    },
  };
}

export const neonClient: NeonClient = {
  user: createModelHandler<User>('User'),
  canteen: createModelHandler<Canteen>('Canteen'),
  category: createModelHandler<Category>('Category'),
  inventoryRecord: createModelHandler<InventoryRecord>('InventoryRecord'),
  menuItem: createModelHandler<MenuItem>('MenuItem'),
  notificationLog: createModelHandler<NotificationLog>('NotificationLog'),
  order: createModelHandler<Order>('Order'),
  orderItem: createModelHandler<OrderItem>('OrderItem'),
  orderStatusHistory: createModelHandler<OrderStatusHistory>('OrderStatusHistory'),
  passwordResetToken: createModelHandler<PasswordResetToken>('PasswordResetToken'),
  payment: createModelHandler<Payment>('Payment'),
  pickupSlot: createModelHandler<PickupSlot>('PickupSlot'),
  promotion: createModelHandler<Promotion>('Promotion'),
  promotionClick: createModelHandler<PromotionClick>('PromotionClick'),
  promotionImpression: createModelHandler<PromotionImpression>('PromotionImpression'),
  staffAssignment: createModelHandler<StaffAssignment>('StaffAssignment'),
  userPreference: createModelHandler<UserPreference>('UserPreference'),
  auditLog: createModelHandler<AuditLog>('AuditLog'),

  async $transaction<R>(fn: (tx: NeonClient) => Promise<R>): Promise<R> {
    // In Neon Serverless, execute transactional block with the Neon client
    return await fn(neonClient);
  },

  async $queryRaw(strings: TemplateStringsArray | string, ...values: any[]) {
    const client = neon(getDatabaseUrl());
    if (typeof strings === 'string') {
      const params = values.length === 1 && Array.isArray(values[0]) ? [values[0]] : values;
      return (await client.query(strings, params)) as any[];
    }
    return (await client(strings, ...values)) as any[];
  },

  async $disconnect() {
    // Serverless client has no persistent connection pool to destroy
  },
};

export default neonClient;

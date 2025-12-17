const mockOp = {
  not: Symbol('not'),
  gte: Symbol('gte'),
  lte: Symbol('lte'),
  lt: Symbol('lt'),
  gt: Symbol('gt'),
  like: Symbol('like'),
  iLike: Symbol('iLike'),
  and: Symbol('and'),
  or: Symbol('or'),
  in: Symbol('in')
};

const mockTransaction = {
  commit: jest.fn(),
  rollback: jest.fn()
};

const mockSequelize = {
  transaction: jest.fn(() => Promise.resolve(mockTransaction)),
  authenticate: jest.fn(),
  fn: jest.fn((func, col) => ({ type: 'FN', func, col })),
  col: jest.fn((colName) => ({ type: 'COL', colName })),
  literal: jest.fn((val) => ({ type: 'LITERAL', val }))
};

const createMockModel = () => ({
  findAndCountAll: jest.fn(),
  findByPk: jest.fn(),
  findOne: jest.fn(),
  findAll: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  destroy: jest.fn(),
  bulkCreate: jest.fn(),
  sum: jest.fn(),
  count: jest.fn(),
  save: jest.fn(),
  increment: jest.fn(),
  decrement: jest.fn()
});

module.exports = {
  sequelize: mockSequelize,
  Op: mockOp,
  Customer: createMockModel(),
  Product: createMockModel(),
  ProductVariant: createMockModel(),
  Order: createMockModel(),
  OrderItem: createMockModel()
};

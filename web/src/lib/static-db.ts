/* eslint-disable @typescript-eslint/no-explicit-any */
import fixturesRaw from "@/data/fixtures.json";

type Row = Record<string, any>;

const fixtures = {
  libraries: fixturesRaw.libraries as Row[],
  patterns: fixturesRaw.patterns as Row[],
  tags: fixturesRaw.tags as Row[],
  patternTags: fixturesRaw.patternTags as Row[],
  patternImages: fixturesRaw.patternImages as Row[],
  patternVersions: fixturesRaw.patternVersions as Row[],
  patternVersionTags: fixturesRaw.patternVersionTags as Row[],
  upvotes: fixturesRaw.upvotes as Row[],
};

function containsCI(haystack: string | null | undefined, needle: string): boolean {
  if (!haystack) return false;
  return haystack.toLowerCase().includes(needle.toLowerCase());
}

function matchWhere(row: Row, where: any, context?: { table: string }): boolean {
  if (!where || Object.keys(where).length === 0) return true;

  for (const [key, condition] of Object.entries(where) as [string, any][]) {
    if (key === "AND") {
      if (!Array.isArray(condition)) return false;
      if (!condition.every((c: any) => matchWhere(row, c, context))) return false;
      continue;
    }

    if (key === "OR") {
      if (!Array.isArray(condition)) return false;
      if (!condition.some((c: any) => matchWhere(row, c, context))) return false;
      continue;
    }

    if (key === "NOT") {
      if (matchWhere(row, condition, context)) return false;
      continue;
    }

    if (key === "tags" && typeof condition === "object" && condition?.some) {
      const tagCondition = condition.some;
      const patternId = row.id;
      const pts = fixtures.patternTags.filter((pt) => pt.patternId === patternId);
      if (tagCondition.tag) {
        const tagWhere = tagCondition.tag;
        const matched = pts.some((pt) => {
          const tag = fixtures.tags.find((t) => t.id === pt.tagId);
          return tag && matchWhere(tag, tagWhere);
        });
        if (!matched) return false;
      } else if (tagCondition.tagId) {
        const tagIdCondition = tagCondition.tagId;
        if (tagIdCondition.in) {
          const matched = pts.some((pt) => tagIdCondition.in.includes(pt.tagId));
          if (!matched) return false;
        }
      } else if (Object.keys(tagCondition).length === 0) {
        if (pts.length === 0) return false;
      }
      continue;
    }

    if (key === "patterns" && typeof condition === "object" && condition?.some !== undefined) {
      const tagId = row.id;
      const pts = fixtures.patternTags.filter((pt) => pt.tagId === tagId);
      if (Object.keys(condition.some).length === 0) {
        if (pts.length === 0) return false;
      } else {
        const patternWhere = condition.some.pattern || condition.some;
        const matched = pts.some((pt) => {
          const pattern = fixtures.patterns.find((p) => p.id === pt.patternId);
          return pattern && matchWhere(pattern, patternWhere);
        });
        if (!matched) return false;
      }
      continue;
    }

    if (key === "library") {
      if (typeof condition === "object" && condition !== null) {
        const lib = fixtures.libraries.find((l) => l.id === row.libraryId);
        if (!lib || !matchWhere(lib, condition)) return false;
        continue;
      }
    }

    const val = row[key];

    if (condition === null || condition === undefined || typeof condition !== "object") {
      if (val !== condition) return false;
      continue;
    }

    if ("contains" in condition) {
      if (!containsCI(val, condition.contains)) return false;
      continue;
    }

    if ("not" in condition) {
      if (val === condition.not) return false;
      continue;
    }

    if ("in" in condition) {
      if (!condition.in.includes(val)) return false;
      continue;
    }

    if ("gte" in condition || "lte" in condition) {
      const d = new Date(val).getTime();
      if ("gte" in condition && d < new Date(condition.gte).getTime()) return false;
      if ("lte" in condition && d > new Date(condition.lte).getTime()) return false;
      continue;
    }

    if (val !== condition) return false;
  }

  return true;
}

function resolveInclude(row: Row, include: any, table: string): Row {
  const result = { ...row };

  if (!include) return result;

  if (table === "pattern" || table === "patterns") {
    if (include.tags) {
      const pts = fixtures.patternTags.filter((pt) => pt.patternId === row.id);
      if (include.tags.include?.tag) {
        result.tags = pts.map((pt) => ({
          ...pt,
          tag: fixtures.tags.find((t) => t.id === pt.tagId) || null,
        }));
      } else {
        result.tags = pts;
      }
    }

    if (include.images) {
      let imgs = fixtures.patternImages.filter((img) => img.patternId === row.id);
      if (include.images.orderBy?.sortOrder === "asc") {
        imgs = imgs.sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));
      }
      result.images = imgs;
    }

    if (include.library) {
      result.library = fixtures.libraries.find((l) => l.id === row.libraryId) || null;
    }

    if (include.versions) {
      let vers = fixtures.patternVersions.filter((v) => v.patternId === row.id);
      if (include.versions.orderBy?.createdAt === "desc") {
        vers = vers.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      }
      if (include.versions.take) {
        vers = vers.slice(0, include.versions.take);
      }
      if (include.versions.include?.tags) {
        vers = vers.map((v) => {
          const vts = fixtures.patternVersionTags.filter((vt) => vt.versionId === v.id);
          return {
            ...v,
            tags: include.versions.include.tags.include?.tag
              ? vts.map((vt) => ({ ...vt, tag: fixtures.tags.find((t) => t.id === vt.tagId) || null }))
              : vts,
          };
        });
      }
      result.versions = vers;
    }

    if (include._count?.select?.upvotes) {
      result._count = {
        ...result._count,
        upvotes: fixtures.upvotes.filter((u) => u.patternId === row.id).length,
      };
    }

    if (include.collectionPatterns) {
      result.collectionPatterns = [];
    }
  }

  if (table === "library" || table === "libraries") {
    if (include._count?.select?.patterns) {
      result._count = {
        ...result._count,
        patterns: fixtures.patterns.filter((p) => p.libraryId === row.id).length,
      };
    }
  }

  if (table === "tag" || table === "tags") {
    if (include._count?.select?.patterns) {
      result._count = {
        ...result._count,
        patterns: fixtures.patternTags.filter((pt) => pt.tagId === row.id).length,
      };
    }
    if (include.patterns) {
      let pts = fixtures.patternTags.filter((pt) => pt.tagId === row.id);
      if (include.patterns.where) {
        pts = pts.filter((pt) => {
          const pattern = fixtures.patterns.find((p) => p.id === pt.patternId);
          if (!pattern) return false;
          if (include.patterns.where.pattern) {
            return matchWhere(pattern, include.patterns.where.pattern);
          }
          return matchWhere(pattern, include.patterns.where);
        });
      }
      if (include.patterns.select?.pattern) {
        const mapped = pts.map((pt) => {
          const pattern = fixtures.patterns.find((p) => p.id === pt.patternId);
          const selected: any = {};
          for (const field of Object.keys(include.patterns.select.pattern.select || {})) {
            selected[field] = pattern?.[field];
          }
          return { pattern: selected };
        });
        if (include.patterns.orderBy?.pattern?.createdAt === "desc") {
          mapped.sort((a, b) => new Date(b.pattern.createdAt).getTime() - new Date(a.pattern.createdAt).getTime());
        }
        result.patterns = include.patterns.take ? mapped.slice(0, include.patterns.take) : mapped;
      } else {
        result.patterns = pts;
      }
    }
  }

  return result;
}

function applyOrderBy(rows: Row[], orderBy: any): Row[] {
  if (!orderBy) return rows;

  const orders = Array.isArray(orderBy) ? orderBy : [orderBy];
  return [...rows].sort((a, b) => {
    for (const o of orders) {
      for (const [field, dir] of Object.entries(o)) {
        const av = a[field];
        const bv = b[field];
        if (av === bv) continue;
        if (av == null) return 1;
        if (bv == null) return -1;
        const cmp = typeof av === "string" ? av.localeCompare(bv as string) : (av as number) - (bv as number);
        return dir === "desc" ? -cmp : cmp;
      }
    }
    return 0;
  });
}

function makeModel(tableName: string, data: Row[]) {
  return {
    findMany(args?: any) {
      let rows = data.filter((r) => matchWhere(r, args?.where, { table: tableName }));
      rows = applyOrderBy(rows, args?.orderBy);
      if (args?.distinct) {
        const seen = new Set<string>();
        rows = rows.filter((r) => {
          const key = args.distinct.map((d: string) => r[d]).join("|");
          if (seen.has(key)) return false;
          seen.add(key);
          return true;
        });
      }
      if (args?.skip) rows = rows.slice(args.skip);
      if (args?.take) rows = rows.slice(0, args.take);
      if (args?.include) {
        rows = rows.map((r) => resolveInclude(r, args.include, tableName));
      }
      if (args?.select) {
        rows = rows.map((r) => {
          const selected: any = {};
          for (const field of Object.keys(args.select)) {
            selected[field] = r[field];
          }
          return selected;
        });
      }
      return Promise.resolve(rows);
    },

    findFirst(args?: any) {
      const rows = data.filter((r) => matchWhere(r, args?.where, { table: tableName }));
      const row = rows[0] || null;
      if (!row) return Promise.resolve(null);
      const resolved = args?.include ? resolveInclude(row, args.include, tableName) : row;
      return Promise.resolve(resolved);
    },

    findUnique(args?: any) {
      const where = args?.where || {};
      let row: Row | undefined;
      if (where.id) {
        row = data.find((r) => r.id === where.id);
      } else if (where.slug) {
        row = data.find((r) => r.slug === where.slug);
      } else if (where.patternId_visitorId) {
        const { patternId, visitorId } = where.patternId_visitorId;
        row = data.find((r) => r.patternId === patternId && r.visitorId === visitorId);
      } else {
        row = data.find((r) => matchWhere(r, where, { table: tableName }));
      }
      if (!row) return Promise.resolve(null);
      const resolved = args?.include ? resolveInclude(row, args.include, tableName) : row;
      return Promise.resolve(resolved);
    },

    count(args?: any) {
      const rows = data.filter((r) => matchWhere(r, args?.where, { table: tableName }));
      return Promise.resolve(rows.length);
    },

    aggregate(args?: any) {
      const rows = data.filter((r) => matchWhere(r, args?.where, { table: tableName }));
      const result: any = {};
      if (args?._max) {
        result._max = {};
        for (const field of Object.keys(args._max)) {
          const values = rows.map((r) => r[field]).filter((v) => v != null);
          result._max[field] = values.length > 0 ? Math.max(...values.map(Number)) : null;
        }
      }
      return Promise.resolve(result);
    },

    create() { return Promise.reject(new Error("Demo mode is read-only")); },
    update() { return Promise.reject(new Error("Demo mode is read-only")); },
    upsert() { return Promise.reject(new Error("Demo mode is read-only")); },
    delete() { return Promise.reject(new Error("Demo mode is read-only")); },
    deleteMany() { return Promise.reject(new Error("Demo mode is read-only")); },
  };
}

export const staticPrisma = {
  pattern: makeModel("pattern", fixtures.patterns),
  library: makeModel("library", fixtures.libraries),
  tag: makeModel("tag", fixtures.tags),
  patternTag: makeModel("patternTag", fixtures.patternTags),
  patternImage: makeModel("patternImage", fixtures.patternImages),
  patternVersion: makeModel("patternVersion", fixtures.patternVersions),
  patternVersionTag: makeModel("patternVersionTag", fixtures.patternVersionTags),
  upvote: makeModel("upvote", fixtures.upvotes),
};

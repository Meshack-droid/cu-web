#!/usr/bin/env node
/**
 * Generates a feature module (repository/service/controller/routes) on top of
 * the shared BaseRepository/BaseService/BaseController pattern. Used for
 * modules whose SRS requirements are straightforward CRUD over a single
 * table; modules with real workflow logic (authentication, membership) are
 * hand-written instead. Re-run any time to regenerate after editing MODULES.
 */
const fs = require('fs');
const path = require('path');

const SRC = path.join(__dirname, '..', 'src', 'modules');

// name: kebab-case module/folder name & URL segment
// table: backing MySQL table (must already exist in the schema)
// permissionPrefix: permission codes are `${permissionPrefix}.<action>`
// readOnly: true => only list/getById routes are generated (e.g. audit logs)
const MODULES = [
  { name: 'leadership', table: 'executive_terms', permissionPrefix: 'leadership' },
  { name: 'committees', table: 'committees', permissionPrefix: 'committees' },
  { name: 'committee-members', table: 'committee_members', permissionPrefix: 'committees' },
  { name: 'bible-study-groups', table: 'bible_study_groups', permissionPrefix: 'discipleship' },
  { name: 'mentorship-groups', table: 'mentorship_groups', permissionPrefix: 'discipleship' },
  { name: 'evangelism-teams', table: 'evangelism_teams', permissionPrefix: 'evangelism' },
  { name: 'income', table: 'income_records', permissionPrefix: 'finance' },
  { name: 'welfare-cases', table: 'welfare_cases', permissionPrefix: 'welfare' },
  { name: 'assets', table: 'assets', permissionPrefix: 'assets' },
  { name: 'library-resources', table: 'library_resources', permissionPrefix: 'library' },
  { name: 'broadcast-messages', table: 'broadcast_messages', permissionPrefix: 'communication' },
  { name: 'reports', table: 'generated_reports', permissionPrefix: 'reports' },
  { name: 'audit-logs', table: 'audit_logs', permissionPrefix: 'audit', readOnly: true },
];

function pascalCase(str) {
  return str
    .split(/[-_]/g)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join('');
}

function camelCase(str) {
  const p = pascalCase(str);
  return p.charAt(0).toLowerCase() + p.slice(1);
}

function writeFile(filePath, content) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, content);
  console.log('  wrote', path.relative(process.cwd(), filePath));
}

for (const mod of MODULES) {
  const { name, table, permissionPrefix, readOnly = false } = mod;
  const Pascal = pascalCase(name);
  const camel = camelCase(name);
  const dir = path.join(SRC, name);

  console.log(`Generating module: ${name} (table: ${table})`);

  // --- interface -----------------------------------------------------------
  writeFile(
    path.join(dir, 'interfaces', `${name}.interface.ts`),
    `export interface ${Pascal} {\n  id: string;\n  [key: string]: unknown;\n}\n`
  );

  // --- repository ------------------------------------------------------------
  writeFile(
    path.join(dir, 'repositories', `${name}.repository.ts`),
    `import { BaseRepository } from '../../../core/base.repository';\n` +
      `import { ${Pascal} } from '../interfaces/${name}.interface';\n\n` +
      `export class ${Pascal}Repository extends BaseRepository<${Pascal}> {\n` +
      `  constructor() {\n    super('${table}');\n  }\n` +
      `  // Add bespoke queries here as the module's real requirements grow.\n` +
      `}\n`
  );

  // --- service ---------------------------------------------------------------
  writeFile(
    path.join(dir, 'services', `${name}.service.ts`),
    `import { BaseService } from '../../../core/base.service';\n` +
      `import { ${Pascal} } from '../interfaces/${name}.interface';\n` +
      `import { ${Pascal}Repository } from '../repositories/${name}.repository';\n\n` +
      `export class ${Pascal}Service extends BaseService<${Pascal}> {\n` +
      `  constructor(repository: ${Pascal}Repository = new ${Pascal}Repository()) {\n` +
      `    super(repository);\n  }\n` +
      `  // Override list/create/update/remove here once this module needs business rules\n` +
      `  // beyond plain CRUD (approval workflows, notifications, cross-table writes, etc).\n` +
      `}\n`
  );

  // --- controller --------------------------------------------------------------
  writeFile(
    path.join(dir, 'controllers', `${name}.controller.ts`),
    `import { BaseController } from '../../../core/base.controller';\n` +
      `import { ${Pascal} } from '../interfaces/${name}.interface';\n` +
      `import { ${Pascal}Service } from '../services/${name}.service';\n\n` +
      `export const ${camel}Controller = new BaseController<${Pascal}>(new ${Pascal}Service(), '${Pascal}');\n`
  );

  // --- routes --------------------------------------------------------------
  const routesReadOnly =
    `import { Router } from 'express';\n` +
    `import { ${camel}Controller } from '../controllers/${name}.controller';\n` +
    `import { authenticate, loadPermissions, requirePermission } from '../../../middleware/auth.middleware';\n\n` +
    `const router = Router();\n\n` +
    `router.use(authenticate, loadPermissions);\n\n` +
    `router.get('/', requirePermission('${permissionPrefix}.view'), ${camel}Controller.list);\n` +
    `router.get('/:id', requirePermission('${permissionPrefix}.view'), ${camel}Controller.getById);\n\n` +
    `export default router;\n`;

  const routesCrud =
    `import { Router } from 'express';\n` +
    `import { ${camel}Controller } from '../controllers/${name}.controller';\n` +
    `import { authenticate, loadPermissions, requirePermission } from '../../../middleware/auth.middleware';\n\n` +
    `const router = Router();\n\n` +
    `router.use(authenticate, loadPermissions);\n\n` +
    `router.get('/', requirePermission('${permissionPrefix}.view'), ${camel}Controller.list);\n` +
    `router.get('/:id', requirePermission('${permissionPrefix}.view'), ${camel}Controller.getById);\n` +
    `router.post('/', requirePermission('${permissionPrefix}.create'), ${camel}Controller.create);\n` +
    `router.put('/:id', requirePermission('${permissionPrefix}.edit'), ${camel}Controller.update);\n` +
    `router.delete('/:id', requirePermission('${permissionPrefix}.delete'), ${camel}Controller.remove);\n\n` +
    `export default router;\n`;

  writeFile(path.join(dir, 'routes', `${name}.routes.ts`), readOnly ? routesReadOnly : routesCrud);
}

// --- module index, so app.ts has one place to import everything from ---------
const indexLines = [
  `// Auto-generated barrel file. Re-run \`npm run generate:module\` after editing scripts/generate-module.js.`,
];
for (const mod of MODULES) {
  const camel = camelCase(mod.name);
  indexLines.push(`export { default as ${camel}Routes } from '../${mod.name}/routes/${mod.name}.routes';`);
}
writeFile(path.join(SRC, '_generated', 'index.ts'), indexLines.join('\n') + '\n');

console.log(`\nGenerated ${MODULES.length} modules.`);

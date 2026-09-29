import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-d1-sqlite'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.run(sql`CREATE TABLE \`posts_sites\` (
  	\`order\` integer NOT NULL,
  	\`parent_id\` integer NOT NULL,
  	\`value\` text,
  	\`id\` integer PRIMARY KEY NOT NULL,
  	FOREIGN KEY (\`parent_id\`) REFERENCES \`posts\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`posts_sites_order_idx\` ON \`posts_sites\` (\`order\`);`)
  await db.run(sql`CREATE INDEX \`posts_sites_parent_idx\` ON \`posts_sites\` (\`parent_id\`);`)
  await db.run(sql`CREATE INDEX \`posts_sites_value_idx\` ON \`posts_sites\` (\`value\`);`)
  await db.run(sql`CREATE TABLE \`_posts_v_version_sites\` (
  	\`order\` integer NOT NULL,
  	\`parent_id\` integer NOT NULL,
  	\`value\` text,
  	\`id\` integer PRIMARY KEY NOT NULL,
  	FOREIGN KEY (\`parent_id\`) REFERENCES \`_posts_v\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`_posts_v_version_sites_order_idx\` ON \`_posts_v_version_sites\` (\`order\`);`)
  await db.run(sql`CREATE INDEX \`_posts_v_version_sites_parent_idx\` ON \`_posts_v_version_sites\` (\`parent_id\`);`)
  await db.run(sql`CREATE INDEX \`_posts_v_version_sites_value_idx\` ON \`_posts_v_version_sites\` (\`value\`);`)

  // Every post written before this field existed was written for Devora.
  // Without this they would have no site at all and drop off devoratv as soon
  // as the frontend starts filtering by site.
  await db.run(sql`INSERT INTO \`posts_sites\` (\`order\`, \`parent_id\`, \`value\`) SELECT 1, \`id\`, 'devoratv' FROM \`posts\`;`)
  await db.run(sql`INSERT INTO \`_posts_v_version_sites\` (\`order\`, \`parent_id\`, \`value\`) SELECT 1, \`id\`, 'devoratv' FROM \`_posts_v\`;`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.run(sql`DROP TABLE \`posts_sites\`;`)
  await db.run(sql`DROP TABLE \`_posts_v_version_sites\`;`)
}

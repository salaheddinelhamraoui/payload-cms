import * as migration_20250929_111647 from './20250929_111647';
import * as migration_20260915_132513_blog_collections from './20260915_132513_blog_collections';
import * as migration_20260929_194432_post_sites from './20260929_194432_post_sites';

export const migrations = [
  {
    up: migration_20250929_111647.up,
    down: migration_20250929_111647.down,
    name: '20250929_111647',
  },
  {
    up: migration_20260915_132513_blog_collections.up,
    down: migration_20260915_132513_blog_collections.down,
    name: '20260915_132513_blog_collections',
  },
  {
    up: migration_20260929_194432_post_sites.up,
    down: migration_20260929_194432_post_sites.down,
    name: '20260929_194432_post_sites'
  },
];

import type { Archetype } from '@/design/constants'

// Import all avatar images
import bro_stage1 from './bro_stage1.png'
import bro_stage2 from './bro_stage2.png'
import bro_stage3 from './bro_stage3.png'
import bro_stage4 from './bro_stage4.png'
import bro_stage5 from './bro_stage5.png'

import brute_stage1 from './brute_stage1.png'
import brute_stage2 from './brute_stage2.png'
import brute_stage3 from './brute_stage3.png'
import brute_stage4 from './brute_stage4.png'
import brute_stage5 from './brute_stage5.png'

import bull_stage1 from './bull_stage1.png'
import bull_stage2 from './bull_stage2.png'
import bull_stage3 from './bull_stage3.png'
import bull_stage4 from './bull_stage4.png'
import bull_stage5 from './bull_stage5.png'

import himbo_stage1 from './himbo_stage1.png'
import himbo_stage2 from './himbo_stage2.png'
import himbo_stage3 from './himbo_stage3.png'
import himbo_stage4 from './himbo_stage4.png'
import himbo_stage5 from './himbo_stage5.png'

import pup_stage1 from './pup_stage1.png'
import pup_stage2 from './pup_stage2.png'
import pup_stage3 from './pup_stage3.png'
import pup_stage4 from './pup_stage4.png'
import pup_stage5 from './pup_stage5.png'

// Avatar images organized by archetype and stage
export const AVATAR_IMAGES: Record<Archetype, Record<1 | 2 | 3 | 4 | 5, string>> = {
  bro: {
    1: bro_stage1,
    2: bro_stage2,
    3: bro_stage3,
    4: bro_stage4,
    5: bro_stage5,
  },
  brute: {
    1: brute_stage1,
    2: brute_stage2,
    3: brute_stage3,
    4: brute_stage4,
    5: brute_stage5,
  },
  bull: {
    1: bull_stage1,
    2: bull_stage2,
    3: bull_stage3,
    4: bull_stage4,
    5: bull_stage5,
  },
  himbo: {
    1: himbo_stage1,
    2: himbo_stage2,
    3: himbo_stage3,
    4: himbo_stage4,
    5: himbo_stage5,
  },
  pup: {
    1: pup_stage1,
    2: pup_stage2,
    3: pup_stage3,
    4: pup_stage4,
    5: pup_stage5,
  },
}

/** Get avatar image for a specific archetype and stage */
export function getAvatarImage(archetype: Archetype, stage: 1 | 2 | 3 | 4 | 5): string {
  return AVATAR_IMAGES[archetype][stage]
}

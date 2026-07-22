import type { Tech } from '@domain';
import { cn } from '@web/lib/utils';
import type { TechStatus } from '../status';

type UnitArchetype =
  | 'carrier'
  | 'cruiser'
  | 'destroyer'
  | 'dreadnought'
  | 'fighter'
  | 'infantry'
  | 'pds'
  | 'space-dock'
  | 'war-sun'
  | 'flagship';

const ARCHETYPE_BY_ID: Partial<Record<string, UnitArchetype>> = {
  ac2: 'carrier',
  cv2: 'carrier',
  cr2: 'cruiser',
  se2: 'cruiser',
  dd2: 'destroyer',
  swa2: 'destroyer',
  dn2: 'dreadnought',
  exo2: 'dreadnought',
  sdn2: 'dreadnought',
  ff2: 'fighter',
  hcf2: 'fighter',
  cl2: 'infantry',
  inf2: 'infantry',
  lw2: 'infantry',
  so2: 'infantry',
  ht2: 'pds',
  pds2: 'pds',
  dt2: 'space-dock',
  ffac2: 'space-dock',
  sd2: 'space-dock',
  pws2: 'war-sun',
  ws: 'war-sun',
  m2: 'flagship',
};

function archetypeOf(tech: Tech): UnitArchetype {
  return ARCHETYPE_BY_ID[tech.id] ?? 'flagship';
}

interface UnitSchematicProps {
  tech: Tech;
  status: TechStatus;
  className?: string;
}

/** Decorative, code-native fleet blueprint. It intentionally suggests a unit rather than reproducing game art. */
export function UnitSchematic({ tech, status, className }: UnitSchematicProps) {
  const archetype = archetypeOf(tech);
  const isWarSun = archetype === 'war-sun';

  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 240 120"
      fill="none"
      className={cn(
        'pointer-events-none absolute right-1 top-9 h-[116px] w-[54%] transition-[opacity,transform] duration-300',
        isWarSun ? 'text-amber-300' : 'text-cyan-200',
        status === 'locked' ? 'opacity-[0.12]' : status === 'owned' ? 'opacity-[0.3]' : 'opacity-[0.2]',
        'group-hover:translate-x-[-2px] group-hover:opacity-[0.34]',
        className,
      )}
    >
      <g
        stroke="currentColor"
        strokeWidth="1.35"
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      >
        <path d="M18 101H222" opacity="0.22" strokeDasharray="3 7" />
        <path d="M26 94v14M214 94v14M20 101h12M208 101h12" opacity="0.32" />
        <path d="M34 22h18M43 13v18M188 22h18M197 13v18" opacity="0.18" />
        <UnitGlyph archetype={archetype} />
      </g>
    </svg>
  );
}

function UnitGlyph({ archetype }: { archetype: UnitArchetype }) {
  switch (archetype) {
    case 'carrier':
      return (
        <>
          <path d="m27 72 31-27h116l39 27-39 16H59Z" />
          <path d="m77 45 18-17h61l18 17M63 61h127M83 88l-14 15m103-15 15 15" opacity="0.72" />
          <path d="M92 55h56v23H92zM103 60h34M103 67h34M103 74h34" opacity="0.48" />
        </>
      );
    case 'cruiser':
      return (
        <>
          <path d="m25 72 65-27 22-27h17l21 27 65 27-65 12-21 22h-17L90 84Z" />
          <path d="m90 45 18 17h46l-4-17M90 84l18-13h46l-4 13M120 18v88" opacity="0.68" />
          <path d="m44 72 50-7m102 7-46-7" opacity="0.4" />
        </>
      );
    case 'destroyer':
      return (
        <>
          <path d="m27 71 69-16 17-27h15l17 27 68 16-68 12-17 23h-15L96 83Z" />
          <path d="m96 55 20 13h25l4-13M96 83l20-10h25l4 10M121 28v78" opacity="0.68" />
          <path d="M46 70h42m65 0h41" opacity="0.42" />
        </>
      );
    case 'dreadnought':
      return (
        <>
          <path d="m21 78 30-33 47-18h63l50 36-17 31H58Z" />
          <path d="m51 45 49 17h78l-17-35M58 94l42-21h78M100 62v32M129 27v67" opacity="0.72" />
          <path d="M73 50h20m75 8h18M78 85h18m70 0h18" opacity="0.45" />
        </>
      );
    case 'fighter':
      return (
        <>
          <path d="m28 83 61-24 23-39h16l23 39 61 24-64-8-20 31h-16L91 75Z" />
          <path d="m89 59 28 11h22l12-11M91 75l26-3h22l9 3M120 20v86" opacity="0.72" />
          <path d="M51 80 91 69m98 11-38-11" opacity="0.4" />
        </>
      );
    case 'infantry':
      return (
        <>
          <circle cx="120" cy="35" r="15" />
          <path d="M103 32c5-13 29-13 34 0M108 53l-13 21 14 7 11-14 11 14 14-7-13-21M109 81l-6 24m28-24 6 24M98 105h14m16 0h14" />
          <path d="M73 85h20m54 0h20M83 75v20m74-20v20" opacity="0.34" />
        </>
      );
    case 'pds':
      return (
        <>
          <path d="M87 94h66l-9-22h-48ZM104 72l7-22h18l7 22M120 50V25M120 32l38-15M120 32 82 17" />
          <path d="M80 94h80M96 101h48M111 42h18" opacity="0.65" />
          <circle cx="120" cy="32" r="5" />
          <path d="M54 17h22m88 0h22" opacity="0.3" />
        </>
      );
    case 'space-dock':
      return (
        <>
          <ellipse cx="120" cy="67" rx="74" ry="28" />
          <ellipse cx="120" cy="67" rx="47" ry="16" />
          <path d="M120 27v80M46 67h148M69 47l23 14m79-14-23 14M69 87l23-14m79 14-23-14" opacity="0.64" />
          <path d="m108 52 12-22 12 22-12 15Z" />
        </>
      );
    case 'war-sun':
      return (
        <>
          <circle cx="120" cy="65" r="38" />
          <circle cx="120" cy="65" r="25" />
          <circle cx="120" cy="65" r="7" />
          <path d="M120 12v15M120 103v15M67 65H44m129 0h23M82 27l11 11m54 54 11 11m0-76-11 11M93 92l-11 11" />
          <path d="M88 50h64M88 80h64M102 31l-9 19m45-19 14 19M102 99l-9-19m45 19 14-19" opacity="0.62" />
        </>
      );
    case 'flagship':
      return (
        <>
          <path d="m22 74 45-31 39 6 14-29 14 29 39-6 45 31-52 15-32-8-14 25-14-25-32 8Z" />
          <circle cx="120" cy="65" r="12" />
          <path d="M67 43 96 66 67 89m106-46-29 23 29 23M120 20v33m0 24v29" opacity="0.68" />
        </>
      );
  }
}

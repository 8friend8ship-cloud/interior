import { generateDeterministicProjectPlan } from '../services/deterministicEstimate.js';

function details(area: number) {
  return {
    projectScope: 'full',
    area,
    buildingType: 'apartment',
    wants3DGeneration: false,
    scopeFlags: {},
  } as any;
}

function quantity(plan: any, pattern: RegExp) {
  const item = plan.costEstimate.find((row: any) => pattern.test(`${row.category} ${row.item}`));
  return item?.quantity ?? null;
}

export default function handler(_req: any, res: any) {
  res.setHeader('Cache-Control', 'no-store');
  const plan32 = generateDeterministicProjectPlan(details(32));
  const plan40 = generateDeterministicProjectPlan(details(40));

  const actual = {
    area32: {
      wallpaper: quantity(plan32, /도배|벽지/),
      flooring: quantity(plan32, /강마루|바닥/),
      cleaning: quantity(plan32, /입주 청소|준공/),
    },
    area40: {
      wallpaper: quantity(plan40, /도배|벽지/),
      flooring: quantity(plan40, /강마루|바닥/),
      cleaning: quantity(plan40, /입주 청소|준공/),
    },
  };

  const expected = {
    area32: { wallpaper: 80, flooring: 28, cleaning: 32 },
    area40: { wallpaper: 100, flooring: 35, cleaning: 40 },
  };

  return res.status(200).json({
    ok: true,
    fixtureId: 'INTERIOR_QUANTITY_REVERSE_CHECK_V1',
    expected,
    actual,
    pass: JSON.stringify(expected) === JSON.stringify(actual),
  });
}

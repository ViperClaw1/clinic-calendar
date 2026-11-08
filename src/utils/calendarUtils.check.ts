// Run: npx esbuild src/utils/calendarUtils.check.ts --bundle --platform=node --log-level=error | node
import { Appointment } from '@/types';
import { layoutAppointments } from './calendarUtils';

const apt = (id: string, startTime: string, duration: Appointment['duration']): Appointment => ({
  id, startTime, duration, patientId: 'p', physicianId: 'd', locationId: 'l', date: '2026-01-01', status: 'confirmed', type: 't',
});

const layout = (...items: Appointment[]) =>
  Object.fromEntries(layoutAppointments(items).map((p) => [p.appointment.id, `${p.lane}/${p.laneCount}`]));

const expectLayout = (name: string, actual: object, expected: object) => {
  const [a, e] = [JSON.stringify(actual), JSON.stringify(expected)];
  if (a !== e) throw new Error(`${name}: expected ${e}, got ${a}`);
};

expectLayout('empty', layout(), {});
expectLayout('back-to-back share a lane', layout(apt('a', '09:00', 30), apt('b', '09:30', 30)), { a: '0/1', b: '0/1' });
expectLayout('concurrent split', layout(apt('a', '09:00', 30), apt('b', '09:15', 30)), { a: '0/2', b: '1/2' });
expectLayout('freed lane is reused', layout(apt('a', '09:00', 60), apt('b', '09:00', 15), apt('c', '09:30', 15)), { a: '0/2', b: '1/2', c: '1/2' });
expectLayout('separate clusters', layout(apt('a', '09:00', 30), apt('b', '09:00', 30), apt('c', '11:00', 30)), { a: '0/2', b: '1/2', c: '0/1' });

console.log('calendarUtils checks passed');

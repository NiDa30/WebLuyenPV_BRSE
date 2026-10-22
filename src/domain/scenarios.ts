import csv from '../../shared/brse-scenario.json'
import incident from '../../shared/brse-incident.json'
export const scenarioIds=['csv-change-v1','production-incident-v1'] as const
export type ScenarioId=typeof scenarioIds[number]
export const scenarios=[csv,incident]
export function scenarioById(id:string){const value=scenarios.find(s=>s.id===id);if(!value)throw new Error('Kịch bản không được hỗ trợ.');return value}
export function isScenarioQuestion(id:string){return scenarios.some(s=>s.turns.some(q=>q.id===id))}

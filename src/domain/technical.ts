import authored from '../../shared/technical-drills.json'
export const technicalDrills=authored
export const technicalTopics=['API','SQL','Security'] as const
export function technicalById(id:string){return technicalDrills.find(q=>q.id===id)}
export const technicalStacks=[...new Set(technicalDrills.map(q=>q.stack))]
export const technicalLevels={UNG_DUNG:'Ứng dụng',PHAN_TICH:'Phân tích'} as const
export function filterTechnical(topic:string,stack:string,level:string,query:string){return technicalDrills.filter(q=>(topic==='ALL'||q.topic===topic)&&(stack==='ALL'||q.stack===stack)&&(level==='ALL'||q.level===level)&&`${q.title} ${q.intent} ${q.japanese} ${q.stack}`.toLowerCase().includes(query.trim().toLowerCase()))}

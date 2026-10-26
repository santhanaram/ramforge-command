export type Role = {id:string; name:string; title:string; division:string; level:'head'|'lead'|'specialist'; manager:string|null; mission:string; strengths:string[]; skills:string[]; tasks:string[]; color:string};
type DivDef={key:string;head:[string,string];mission:string;color:string;leads:[string,string,string[]][]};
const divisions:DivDef[]=[
 {key:'Atlas',head:['Atlas Archer','Chief Knowledge & Research Officer'],mission:'Secure permission-aware, attributable expert knowledge and prepare reusable source assets.',color:'#79c3ff',leads:[
 ['Riley Recon','Research Operations Lead',['Olivia Official|Official Source Finder','Aiden Authority|Authority Analyst','Lila Library|Metadata Librarian','Priya Priority|Source Prioritisation Analyst','Iris Intake|Rights-Gated Intake Operator','Theo Transcript|Transcript Importer']],
 ['Mason Metadata','Content Intelligence Lead',['Tessa Timestamp|Timing & Attribution Editor','Quincy Quality|Transcript QA Reviewer','Nina Normalize|Text Normalisation Editor','Sam Semantic|Semantic Chunking Specialist','Dylan Duplicate|Deduplication Analyst','Cora Context|Context Preservation Reviewer']]]},
 {key:'Nova',head:['Nova Nexus','Chief Knowledge Architect & Framework Strategist'],mission:'Turn approved evidence into traceable models, framework cards and decision guidance.',color:'#c69cff',leads:[
 ['Olive Ontology','Knowledge Structures Lead',['Owen Ontology|Ontology Designer','Rhea Retrieval|Retrieval Schema Designer','Seth Search|Search Relevance Engineer','Audrey Audit|Knowledge Coverage Auditor','Nadia Named|Named Framework Extractor','Paula Principle|Principle Synthesis Analyst']],
 ['Felix Framework','Framework Systems Lead',['Ivy Instruction|Framework Instructional Designer','Benny Boundary|Framework Boundary Tester','Derek Decision|Decision Criteria Mapper','Talia Tradeoff|Tradeoff Analyst','Toby Tree|Decision Tree Builder','Una Uncertainty|Uncertainty Analyst']]]},
 {key:'Forge',head:['Forge Falcon','Chief AI Systems & Application Engineer'],mission:'Engineer the dashboard, secure database, human approvals, source retrieval and execution pipeline.',color:'#67dbc2',leads:[
 ['Freya Frontend','Experience Engineering Lead',['Farah Frontend|Frontend Experience Engineer','Sophie Supabase|Supabase Backend Engineer','Ari API|AI Runtime Engineer','Devon Deploy|Release & DevOps Engineer','Oscar Orchestrate|Workflow Orchestration Engineer','Gina Guardrail|Auth & Security Engineer']],
 ['Blake Backend','Platform Engineering Lead',['Ronan Route|API Contract Engineer','Parker Pipeline|Document Ingestion Engineer','Victor Vector|Retrieval & Search Engineer','Tina Test|Automated Testing Engineer','Milo Monitor|Observability Engineer','Evan Environment|Configuration Engineer']]]},
 {key:'Sage',head:['Sage Sterling','Chief Expert Advisory & Learning Strategist'],mission:'Deliver business insights and practical workplace learning grounded in approved expert frameworks.',color:'#f8bd75',leads:[
 ['Clara Consult','Client Strategy Lead',['Chloe Client|Client Intake Diagnostician','Felix Fit|Framework Selector','Ava Action|Action Plan Strategist','Eddie Evidence|Evidence-Based Answer Composer','Casey Corporate|Corporate Scenario Writer','Rory Roleplay|Roleplay Conversation Designer']],
 ['Lena Learning','Learning Design Lead',['Fiona Facilitate|Facilitation Assessment Author','Trent Transfer|Scenario Transfer Tester','Kara KPI|KPI & Measurement Designer','Mira Message|Advisory Messaging Specialist','Nolan Narrative|Case Study Storyliner','Paige Program|Learning Program Builder']]]},
 {key:'Vera',head:['Vera Vantage','Chief Verification, Risk & Quality Officer'],mission:'Independently assess citation quality, rights, privacy, safety, evaluation and release integrity.',color:'#ff9b9e',leads:[
 ['Victor Verify','Verification Lead',['Celia Citation|Citation Validator','Ethan Evidence|Claim Evidence Auditor','Nora Numbers|Numerical Claims Auditor','Conrad Conflict|Contradiction Resolver','Carmen Copyright|Copyright Rights Reviewer','Paula Privacy|Privacy Reviewer']],
 ['Grace Governance','Governance & Compliance Lead',['Irene Identity|Identity & Endorsement Reviewer','Simon Security|Security Governance Reviewer','Becca Benchmark|Benchmark Dataset Builder','Ruby Rubric|Rubric & Scoring Designer','Adam Adversarial|Adversarial Tester','Riley Regression|Regression Analyst']]]}
];
function taskList(title:string,level:string):string[] {
 const focus=title.replace(/^(Chief|Lead)\s+/,'').toLowerCase();
 return [
 `Receive and interpret the ${focus} work brief and success criteria`,
 `Verify inputs, permissions, constraints and relevant dependencies for ${focus}`,
 `Prepare a concrete ${focus} execution plan with owners and milestones`,
 `Apply appropriate specialist techniques to the assigned ${focus} challenge`,
 `Create a structured, versioned deliverable for ${focus}`,
 `Link every factual assertion and expert attribution to source evidence`,
 `Run a documented quality check against task-specific acceptance criteria`,
 `Identify gaps, risks, uncertainties and needed human decisions`,
 `Hand off evidence and outputs to the next authorised team or reviewer`,
 `Record results, lessons learned and the next improvement in the audit log`
 ];
}
export const workforce:Role[]=[];
let count=0;
for (const div of divisions){
 const add=(name:string,title:string,level:Role['level'],manager:string|null)=>{
 const id=`RF-${String(++count).padStart(3,'0')}`;
 const speciality=title.replace(/^Chief /,'').toLowerCase();
 workforce.push({id,name,title,division:div.key,level,manager,mission:level==='head'?div.mission:`Own ${speciality} work for the ${div.key} division; deliver traceable outputs, manage constraints and escalate blockers.`,strengths:level==='head'?['Leadership','Systems thinking','Accountability']:['Attention to detail','Collaboration','Execution'],skills:[speciality,'Evidence provenance','Risk awareness','Clear communication','Quality checks'],tasks:taskList(title,level),color:div.color});
 };
 add(div.head[0],div.head[1],'head',null);
 for (const [lead,leadTitle,specs] of div.leads){add(lead,leadTitle,'lead',div.head[0]);for (const s of specs){const [name,title]=s.split('|');add(name,title,'specialist',lead)}}
}
export const divisionNames=divisions.map(x=>x.key);
export const rolesByDivision=(division:string)=>workforce.filter(r=>r.division===division);

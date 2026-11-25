const __vite__mapDeps=(i,m=__vite__mapDeps,d=(m.f||(m.f=["./xlsx-vendor-BvQW6DFd.js","./rolldown-runtime-DK3Fl9T5.js"])))=>i.map(i=>d[i]);
import{K as e}from"./thatopen-core-CoxG5FP5.js";import{n as t,t as n}from"./CpmGraphSolver-CRuo4nPT.js";import{c as r}from"./main-udmNgk70.js";var i=r(`Excel import`,()=>e(()=>import(`./xlsx-vendor-BvQW6DFd.js`).then(e=>e.t),__vite__mapDeps([0,1]),import.meta.url)),a=class{static parseMSPDI(e){let t=`MS Project Schedule`,r=e.match(/<(?:Title|Name)>(.*?)<\/(?:Title|Name)>/i);r&&(t=r[1].trim());let i=new Map,a=/<ExtendedAttribute[\s\S]*?>([\s\S]*?)<\/ExtendedAttribute>/gi,o;for(;(o=a.exec(e))!==null;){let e=o[1],t=e.match(/<FieldID[^>]*>([\s\S]*?)<\/FieldID>/i)?.[1]?.trim(),n=e.match(/<Alias[^>]*>([\s\S]*?)<\/Alias>/i)?.[1]?.trim();t&&n&&i.set(t,n)}let s=[],c=/<Task[\s\S]*?>([\s\S]*?)<\/Task>/gi,l,u=1,d=[],f=(e,t)=>{let n=RegExp(`<${t}[^>]*>([\\s\\S]*?)<\\/${t}>`,`i`),r=e.match(n);return r?r[1].replace(/&amp;/g,`&`).trim():``},p=e=>e===`0`?`FF`:e===`2`?`SF`:e===`3`?`SS`:`FS`;for(;(l=c.exec(e))!==null;){let t=l[1],n=f(t,`UID`)||`task-${u}`;if(n===`0`&&e.includes(`<UID>1</UID>`))continue;let r=f(t,`Name`)||`Task ${u}`,a=f(t,`Start`),o=f(t,`Finish`),c=Number(f(t,`PercentComplete`)||`0`),m=Number(f(t,`Cost`)||`0`),h=f(t,`WBS`)||f(t,`OutlineNumber`)||String(u),g=Number(f(t,`OutlineLevel`)||`1`),_=Number.isFinite(g)&&g>0?g:1,v=f(t,`Summary`)===`1`,y=f(t,`Critical`)===`1`,b=Number(f(t,`TotalSlack`)||`0`),x=Number(f(t,`FreeSlack`)||`0`),S=isNaN(b)?0:Math.round(b/480),C=isNaN(x)?0:Math.round(x/480);if(!a||!o)continue;let w=a.split(`T`)[0],T=o.split(`T`)[0],E=t.match(/<Baseline\b[^>]*>([\s\S]*?)<\/Baseline>/i)?.[1]??``,D=E?f(E,`Start`):``,O=E?f(E,`Finish`):``,k=D?D.split(`T`)[0]:void 0,A=O?O.split(`T`)[0]:void 0,j=`Planned`;c>=100?j=`Completed`:c>0&&(j=`In Progress`);let M=[],N=/<PredecessorLink\b[^>]*>([\s\S]*?)<\/PredecessorLink>/gi,P;for(;(P=N.exec(t))!==null;){let e=P[1],t=f(e,`PredecessorUID`);if(!t||t===`0`)continue;let n=p(f(e,`Type`)),r=Number(f(e,`LinkLag`)||`0`);M.push({predecessorId:`msp-${t}`,type:n,lagDays:Number.isFinite(r)?Math.round(r/480):0})}for(;d.length>0&&d[d.length-1].level>=_;)d.pop();let F=d.length>0?d[d.length-1].id:void 0,I=``,L=/<ExtendedAttribute[\s\S]*?>([\s\S]*?)<\/ExtendedAttribute>/gi,R;for(;(R=L.exec(t))!==null;){let e=R[1],t=e.match(/<FieldID[^>]*>([\s\S]*?)<\/FieldID>/i)?.[1]?.trim(),n=e.match(/<Value[^>]*>([\s\S]*?)<\/Value>/i)?.[1]?.trim();t&&n&&(i.get(t)||``).toUpperCase()===`SIMULATION`&&(I=n)}I||=r;let z=this.guessCategoryFromName(r),B=`msp-${n}`;d.push({level:_,id:B}),s.push({id:B,name:r,category:z,startDate:w,endDate:T,baselineStartDate:k,baselineEndDate:A,status:j,elementIds:new Set,modelId:``,unitCost:m,quantity:1,wbsCode:h,parentId:F,outlineLevel:_,isSummary:v,predecessors:M.length>0?M:void 0,totalFloat:S,freeFloat:C,isCritical:y,simulationKey:I}),u++}return n(s),{tasks:s,format:`MSPDI_XML`,projectName:t}}static parsePrimaveraP6(e){let t=e.split(/\r?\n/),n=!1,r=[],i=[];for(let e=0;e<t.length;e++){let a=t[e];if(!a.startsWith(`%T	PROJECT`)){if(a.startsWith(`%T	TASK`)){n=!0;continue}if(a.startsWith(`%T	`)&&n&&(n=!1),n){if(a.startsWith(`%F	`))r=a.substring(3).split(`	`);else if(a.startsWith(`%R	`)){let t=a.substring(3).split(`	`),n=e=>{let n=r.indexOf(e);return n>=0?t[n]?.trim():``},o=n(`task_code`)||`T-${e}`,s=n(`task_name`)||`Task ${o}`,c=n(`target_start_date`)||n(`act_start_date`)||n(`early_start_date`),l=n(`target_end_date`)||n(`act_end_date`)||n(`early_end_date`),u=n(`status_code`),d=Number(n(`target_cost`)||`0`);if(!c||!l)continue;let f=this.normalizePrimaveraDate(c),p=this.normalizePrimaveraDate(l),m=`Planned`;u===`TK_Complete`?m=`Completed`:u===`TK_Active`&&(m=`In Progress`),i.push({id:`p6-${o}`,name:s,category:this.guessCategoryFromName(s),startDate:f,endDate:p,status:m,elementIds:new Set,modelId:``,unitCost:d,quantity:1})}}}}return{tasks:i,format:`PRIMAVERA_P6_XER`,projectName:`Primavera P6 Schedule`}}static normalizePrimaveraDate(e){if(e.includes(` `))return e.split(` `)[0];let t=new Date(e);return isNaN(t.getTime())?e:t.toISOString().split(`T`)[0]}static guessCategoryFromName(e){let t=e.toUpperCase();return t.includes(`FOUNDATION`)||t.includes(`EXCAVAT`)||t.includes(`FOOTING`)||t.includes(`PILE`)?`IFCFOOTING`:t.includes(`COLUMN`)||t.includes(`PILLAR`)?`IFCCOLUMN`:t.includes(`BEAM`)||t.includes(`GIRDER`)?`IFCBEAM`:t.includes(`SLAB`)||t.includes(`DECK`)||t.includes(`CONCRETE FLOOR`)?`IFCSLAB`:t.includes(`CURTAIN`)||t.includes(`FACADE`)||t.includes(`WINDOW`)||t.includes(`GLAZING`)?`IFCWINDOW`:t.includes(`WALL`)||t.includes(`PARTITION`)||t.includes(`MASONRY`)?`IFCWALL`:t.includes(`ROOF`)?`IFCROOF`:t.includes(`DOOR`)?`IFCDOOR`:t.includes(`STAIR`)?`IFCSTAIR`:t.includes(`MEP`)||t.includes(`HVAC`)||t.includes(`DUCT`)||t.includes(`PIPE`)||t.includes(`ELECTRIC`)?`IFCFLOWSEGMENT`:`IFCELEMENT`}static exportToMSPDI(e,t=`BIM-Kintsugi 4D Schedule`){let n=e.reduce((e,t)=>!e||t.startDate<e?t.startDate:e,``)||`2026-06-18`,r=e.reduce((e,t)=>!e||t.endDate>e?t.endDate:e,``)||`2026-12-31`,i=e=>(e||``).replace(/&/g,`&amp;`).replace(/</g,`&lt;`).replace(/>/g,`&gt;`).replace(/"/g,`&quot;`).replace(/'/g,`&apos;`),a=new Map,o=1,s=e=>{let t=(e||``).toUpperCase();return t.includes(`FOOT`)||t.includes(`PILE`)?`Substructure & Geotechnical Crew`:t.includes(`COLUMN`)?`Structural Concrete Columns Crew`:t.includes(`BEAM`)||t.includes(`MEMBER`)?`Structural Framing & Steel Crew`:t.includes(`SLAB`)?`Concrete Slabs & Decks Crew`:t.includes(`WALL`)?`Wall & Partition Masonry Crew`:t.includes(`ROOF`)?`Roofing & Waterproofing Trade`:t.includes(`DOOR`)||t.includes(`WINDOW`)||t.includes(`CURTAIN`)?`Glazing & Enclosure Trade`:t.includes(`STAIR`)||t.includes(`RAMP`)?`Vertical Circulation Crew`:t.includes(`FLOW`)||t.includes(`MEP`)||t.includes(`DUCT`)||t.includes(`PIPE`)?`MEP Building Services Trade`:t.includes(`COVERING`)||t.includes(`FINISH`)?`Interior Architectural Finishes Crew`:`General Construction Trade`};e.forEach(e=>{let t=e.category||`General`;a.has(t)||a.set(t,{uid:o++,name:s(t)})});let c=Array.from(a.values()).map(e=>`    <Resource>
      <UID>${e.uid}</UID>
      <ID>${e.uid}</ID>
      <Name>${i(e.name)}</Name>
      <Type>1</Type>
      <MaxUnits>1.0</MaxUnits>
    </Resource>`).join(`
`),l=[],u=1,d=new Date(n).getTime(),f=new Date(r).getTime(),p=Math.max(1,Math.round((f-d)/864e5))*8,m=`    <Task>
      <UID>0</UID>
      <ID>0</ID>
      <Name>${i(t)}</Name>
      <Type>0</Type>
      <IsNull>0</IsNull>
      <CreateDate>${n}T08:00:00</CreateDate>
      <Active>1</Active>
      <Manual>0</Manual>
      <WBS>0</WBS>
      <OutlineNumber>0</OutlineNumber>
      <OutlineLevel>0</OutlineLevel>
      <Priority>500</Priority>
      <Start>${n}T08:00:00</Start>
      <Finish>${r}T17:00:00</Finish>
      <Duration>PT${p}H0M0S</Duration>
      <DurationFormat>7</DurationFormat>
      <Work>PT${p}H0M0S</Work>
      <Milestone>0</Milestone>
      <PercentComplete>0</PercentComplete>
      <ConstraintType>0</ConstraintType>
      <CalendarUID>1</CalendarUID>
    </Task>`,h=new Map;e.forEach((e,t)=>h.set(e.id,t+1));let g=e=>e===`FF`?0:e===`SF`?2:e===`SS`?3:1,_=e.map((e,t)=>{let n=t+1,r=new Date(e.startDate),o=new Date(e.endDate),s=Math.max(1,Math.round((o.getTime()-r.getTime())/864e5))*8,c=e.unitCost?e.unitCost*(e.quantity||1):0,d=(e.name||`Task ${n}`).replace(/^(Text\.[A-Za-z0-9_]+|SIMULATION|Reference|Pset_[A-Za-z0-9_]+):\s*/i,``).trim()||e.name,f=(e.category||`General`).replace(/^(Text\.[A-Za-z0-9_]+|SIMULATION|Reference|Pset_[A-Za-z0-9_]+):\s*/i,``).trim()||e.category||`General`,p=e.wbsCode||String(n),m=e.outlineLevel??(p.includes(`.`)?p.split(`.`).length:1),_=e.elementIds?e.elementIds.size:e.quantity||1,v=e.isCritical?`YES`:`NO`,y=(e.totalFloat??0)*8,b=(e.freeFloat??0)*8,x=a.get(e.category||`General`);x&&l.push(`    <Assignment>
      <UID>${u++}</UID>
      <TaskUID>${n}</TaskUID>
      <ResourceUID>${x.uid}</ResourceUID>
      <Units>1.0</Units>
      <Cost>${c.toFixed(2)}</Cost>
    </Assignment>`);let S=``;e.predecessors&&e.predecessors.length>0?S=e.predecessors.map(e=>{let t=h.get(e.predecessorId);if(!t)return``;let n=Math.round((e.lagDays??0)*480);return`\n      <PredecessorLink>
        <PredecessorUID>${t}</PredecessorUID>
        <Type>${g(e.type)}</Type>
        <CrossProject>0</CrossProject>
        <LinkLag>${n}</LinkLag>
        <LagFormat>7</LagFormat>
      </PredecessorLink>`}).join(``):t>0&&!e.isSummary&&(S=`\n      <PredecessorLink>
        <PredecessorUID>${t}</PredecessorUID>
        <Type>1</Type>
        <CrossProject>0</CrossProject>
        <LinkLag>0</LinkLag>
        <LagFormat>7</LagFormat>
      </PredecessorLink>`);let C=e.baselineStartDate||e.baselineEndDate?`\n      <Baseline>\n        <Number>0</Number>\n        <Start>${e.baselineStartDate||e.startDate}T08:00:00</Start>\n        <Finish>${e.baselineEndDate||e.endDate}T17:00:00</Finish>\n      </Baseline>`:``,w=e.status===`Completed`?100:e.status===`In Progress`?50:0,T=+(s<=0),E=Math.round(s*w/100),D=Math.max(0,s-E);return`    <Task>
      <UID>${n}</UID>
      <ID>${n}</ID>
      <Name>${i(d)}</Name>
      <Type>0</Type>
      <IsNull>0</IsNull>
      <Summary>${+!!e.isSummary}</Summary>
      <CreateDate>${e.startDate}T08:00:00</CreateDate>
      <Active>1</Active>
      <Manual>0</Manual>
      <WBS>${i(p)}</WBS>
      <OutlineNumber>${i(p)}</OutlineNumber>
      <OutlineLevel>${m}</OutlineLevel>
      <Priority>500</Priority>
      <Start>${e.startDate}T08:00:00</Start>
      <Finish>${e.endDate}T17:00:00</Finish>
      <Duration>PT${s}H0M0S</Duration>
      <DurationFormat>7</DurationFormat>
      <Work>PT${s}H0M0S</Work>
      <RemainingDuration>PT${D}H0M0S</RemainingDuration>
      <ActualDuration>PT${E}H0M0S</ActualDuration>
      <RemainingWork>PT${D}H0M0S</RemainingWork>
      <ActualWork>PT${E}H0M0S</ActualWork>
      <Milestone>${T}</Milestone>
      <PercentComplete>${w}</PercentComplete>
      <PercentWorkComplete>${w}</PercentWorkComplete>
      <Cost>${c.toFixed(2)}</Cost>
      <EarlyStart>${e.earlyStart||e.startDate}T08:00:00</EarlyStart>
      <EarlyFinish>${e.earlyFinish||e.endDate}T17:00:00</EarlyFinish>
      <LateStart>${e.lateStart||e.startDate}T08:00:00</LateStart>
      <LateFinish>${e.lateFinish||e.endDate}T17:00:00</LateFinish>
      <FreeSlack>${b*60}</FreeSlack>
      <TotalSlack>${y*60}</TotalSlack>
      <Critical>${+!!e.isCritical}</Critical>
      <ConstraintType>0</ConstraintType>
      <CalendarUID>1</CalendarUID>${S}${C}
      <ExtendedAttribute>
        <FieldID>188743731</FieldID>
        <Value>${i(f)}</Value>
      </ExtendedAttribute>
      <ExtendedAttribute>
        <FieldID>188743734</FieldID>
        <Value>${i(p)}</Value>
      </ExtendedAttribute>
      <ExtendedAttribute>
        <FieldID>188743737</FieldID>
        <Value>${_}</Value>
      </ExtendedAttribute>
      <ExtendedAttribute>
        <FieldID>188743740</FieldID>
        <Value>${v}</Value>
      </ExtendedAttribute>
    </Task>`}).join(`
`),v=l.join(`
`);return`<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Project xmlns="http://schemas.microsoft.com/project">
  <Name>${i(t)}</Name>
  <Title>${i(t)}</Title>
  <Company>BIM Kintsugi Enterprise 4D</Company>
  <CalendarUID>1</CalendarUID>
  <StartDate>${n}T08:00:00</StartDate>
  <FinishDate>${r}T17:00:00</FinishDate>
  <ScheduleFromStart>1</ScheduleFromStart>
  <MinutesPerDay>480</MinutesPerDay>
  <MinutesPerWeek>2400</MinutesPerWeek>
  <DaysPerMonth>20</DaysPerMonth>
  <DefaultStartTime>08:00:00</DefaultStartTime>
  <DefaultFinishTime>17:00:00</DefaultFinishTime>
  <DefaultTaskType>0</DefaultTaskType>
  <ExtendedAttributes>
    <ExtendedAttribute>
      <FieldID>188743731</FieldID>
      <FieldName>Text1</FieldName>
      <Alias>IFC Category</Alias>
    </ExtendedAttribute>
    <ExtendedAttribute>
      <FieldID>188743734</FieldID>
      <FieldName>Text2</FieldName>
      <Alias>WBS Code</Alias>
    </ExtendedAttribute>
    <ExtendedAttribute>
      <FieldID>188743737</FieldID>
      <FieldName>Number1</FieldName>
      <Alias>BIM Element Count</Alias>
    </ExtendedAttribute>
    <ExtendedAttribute>
      <FieldID>188743740</FieldID>
      <FieldName>Text3</FieldName>
      <Alias>Critical Path (CPM)</Alias>
    </ExtendedAttribute>
  </ExtendedAttributes>
  <Calendars>
    <Calendar>
      <UID>1</UID>
      <Name>Standard 5 Day Workweek</Name>
      <IsBaseCalendar>1</IsBaseCalendar>
      <WeekDays>
        <WeekDay>
          <DayType>1</DayType>
          <DayWorking>0</DayWorking>
        </WeekDay>
        <WeekDay>
          <DayType>2</DayType>
          <DayWorking>1</DayWorking>
          <WorkingTimes>
            <WorkingTime>
              <FromTime>08:00:00</FromTime>
              <ToTime>12:00:00</ToTime>
            </WorkingTime>
            <WorkingTime>
              <FromTime>13:00:00</FromTime>
              <ToTime>17:00:00</ToTime>
            </WorkingTime>
          </WorkingTimes>
        </WeekDay>
        <WeekDay>
          <DayType>3</DayType>
          <DayWorking>1</DayWorking>
          <WorkingTimes>
            <WorkingTime>
              <FromTime>08:00:00</FromTime>
              <ToTime>12:00:00</ToTime>
            </WorkingTime>
            <WorkingTime>
              <FromTime>13:00:00</FromTime>
              <ToTime>17:00:00</ToTime>
            </WorkingTime>
          </WorkingTimes>
        </WeekDay>
        <WeekDay>
          <DayType>4</DayType>
          <DayWorking>1</DayWorking>
          <WorkingTimes>
            <WorkingTime>
              <FromTime>08:00:00</FromTime>
              <ToTime>12:00:00</ToTime>
            </WorkingTime>
            <WorkingTime>
              <FromTime>13:00:00</FromTime>
              <ToTime>17:00:00</ToTime>
            </WorkingTime>
          </WorkingTimes>
        </WeekDay>
        <WeekDay>
          <DayType>5</DayType>
          <DayWorking>1</DayWorking>
          <WorkingTimes>
            <WorkingTime>
              <FromTime>08:00:00</FromTime>
              <ToTime>12:00:00</ToTime>
            </WorkingTime>
            <WorkingTime>
              <FromTime>13:00:00</FromTime>
              <ToTime>17:00:00</ToTime>
            </WorkingTime>
          </WorkingTimes>
        </WeekDay>
        <WeekDay>
          <DayType>6</DayType>
          <DayWorking>1</DayWorking>
          <WorkingTimes>
            <WorkingTime>
              <FromTime>08:00:00</FromTime>
              <ToTime>12:00:00</ToTime>
            </WorkingTime>
            <WorkingTime>
              <FromTime>13:00:00</FromTime>
              <ToTime>17:00:00</ToTime>
            </WorkingTime>
          </WorkingTimes>
        </WeekDay>
        <WeekDay>
          <DayType>7</DayType>
          <DayWorking>0</DayWorking>
        </WeekDay>
      </WeekDays>
    </Calendar>
  </Calendars>
  <Tasks>
${m}
${_}
  </Tasks>
  <Resources>
${c}
  </Resources>
  <Assignments>
${v}
  </Assignments>
</Project>`}static exportToPrimaveraP6(e,t=`BIM-Kintsugi 4D Schedule`){let n=e.reduce((e,t)=>!e||t.startDate<e?t.startDate:e,``)||`2026-06-18`,r=e.reduce((e,t)=>!e||t.endDate>e?t.endDate:e,``)||`2026-12-31`,i=`ERMHDR\t24.12\t${new Date().toISOString().split(`T`)[0]}\tPROJECTS\tUSER\tBIM-Kintsugi\n`;return i+=`%T	PROJECT
`,i+=`%F	proj_id	proj_short_name	clndr_id	plan_start_date	plan_end_date
`,i+=`%R\t1\t${t.replace(/\t/g,` `).slice(0,32)}\t1\t${n} 08:00\t${r} 17:00\n`,i+=`%T	CALENDAR
`,i+=`%F	clndr_id	clndr_name	clndr_type	day_hr_cnt	week_hr_cnt
`,i+=`%R	1	Standard 5 Day Workweek	CA_Base	8.0	40.0
`,i+=`%T	TASK
`,i+=`%F	task_id	proj_id	task_code	task_name	status_code	target_start_date	target_end_date	target_cost
`,e.forEach((e,t)=>{let n=t+1,r=`TK-${String(t+1).padStart(3,`0`)}`,a=e.status===`Completed`?`TK_Complete`:e.status===`In Progress`?`TK_Active`:`TK_NotStart`,o=(e.unitCost?e.unitCost*(e.quantity||1):0).toFixed(2),s=(e.name||`Task ${n}`).replace(/^(Text\.[A-Za-z0-9_]+|SIMULATION|Reference|Pset_[A-Za-z0-9_]+):\s*/i,``).replace(/\t/g,` `).trim();i+=`%R\t${n}\t1\t${r}\t${s}\t${a}\t${e.startDate} 08:00\t${e.endDate} 17:00\t${o}\n`}),i+=`%E
`,i}static async parseExcel(e,t=`Excel Project Schedule`){let r=await i.load(),a;try{a=r.read(e,{type:`array`})}catch(e){return console.error(`XLSX read error:`,e),{tasks:[],format:`EXCEL_WORKBOOK`,projectName:t}}let o=e=>{if(e==null||e===``)return``;if(typeof e==`number`){let t=new Date(Math.round((e-25569)*86400*1e3));return isNaN(t.getTime())?``:t.toISOString().split(`T`)[0]}let t=String(e).trim();if(!t)return``;let n=new Date(t);return isNaN(n.getTime())?t:n.toISOString().split(`T`)[0]},s=e=>{if(e==null)return 0;if(typeof e==`number`)return isNaN(e)?0:e;let t=Number(String(e).replace(/[^0-9.-]/g,``));return isNaN(t)?0:t},c=[];if(a.Sheets.Tasks){let e=a.Sheets.Tasks,n=r.utils.sheet_to_json(e,{header:1});if(n.length>1){let e=n[0].map(e=>String(e||``).trim().toLowerCase()),i=e.findIndex(e=>e.includes(`taskid`)||e.includes(`id`)),l=e.findIndex(e=>e.includes(`taskname`)||e.includes(`name`)),u=e.findIndex(e=>e.includes(`start`)),d=e.findIndex(e=>e.includes(`finish`)||e.includes(`end`)),f=e.findIndex(e=>e.includes(`3dresource`)||e.includes(`resource`)),p=new Map;if(a.Sheets.DirectCosts){let e=r.utils.sheet_to_json(a.Sheets.DirectCosts,{header:1});if(e.length>1){let t=e[0].map(e=>String(e||``).trim().toLowerCase()),n=t.findIndex(e=>e.includes(`taskid`)),r=t.findIndex(e=>e.includes(`cost`)||e.includes(`directcost`)||e.includes(`total`));if(n>=0&&r>=0)for(let t=1;t<e.length;t++){let i=String(e[t][n]||``).trim(),a=s(e[t][r]);i&&a>0&&p.set(i,(p.get(i)||0)+a)}}}let m=new Map,h=a.Sheets.ResourceAssignments||a.Sheets[`3DResources`]||a.Sheets.Resources;if(h){let e=r.utils.sheet_to_json(h,{header:1});if(e.length>1){let t=e[0].map(e=>String(e||``).trim().toLowerCase().replace(/[\s_\-]/g,``)),n=t.findIndex(e=>e.includes(`taskid`)||e.includes(`task`)),r=t.findIndex(e=>e.includes(`objects3d`)||e.includes(`object`)||e.includes(`element`)||e.includes(`expressid`)),i=t.findIndex(e=>e.includes(`resourceid`)||e.includes(`resource`));for(let t=1;t<e.length;t++){let a=e[t];if(!a)continue;let o=n>=0&&a[n]?String(a[n]).trim():``,c=r>=0&&a[r]?String(a[r]).trim():``,l=i>=0&&a[i]?String(a[i]).trim():``,u=o||l;if(u&&c){m.has(u)||m.set(u,new Set);let e=m.get(u);c.split(/[,;\s|]+/).forEach(t=>{let n=s(t);n>0&&e.add(n)})}}}}for(let e=1;e<n.length;e++){let t=n[e];if(!t||t.length===0)continue;let r=i>=0&&t[i]?String(t[i]).trim():`synchro-task-${e}`,a=l>=0&&t[l]?String(t[l]).trim():`Task ${r}`,s=u>=0?o(t[u]):``,h=d>=0?o(t[d]):``;if(!s||!h)continue;let g=f>=0&&t[f]?String(t[f]).trim():``,_=p.get(r)||0,v=m.get(r)||(g?m.get(g):void 0)||new Set;c.push({id:r,name:a,category:`IFCELEMENT`,startDate:s,endDate:h,status:`Planned`,modelId:``,elementIds:v,unitCost:_>0?_:0,totalCost:_,quantity:Math.max(1,v.size),simulationKey:g||a})}if(c.length>0)return{tasks:c,format:`EXCEL_WORKBOOK`,projectName:t.replace(/\.[^/.]+$/,``)}}}let l=a.SheetNames.find(e=>/schedule|tasks|cape|gantt/i.test(e))||a.SheetNames[0],u=a.Sheets[l];if(u){let e=r.utils.sheet_to_json(u,{header:1});if(e.length>1){let t=e[0].map(e=>String(e||``).trim().toLowerCase().replace(/[\s_\-]/g,``)),r=(...e)=>{let n=e.map(e=>e.toLowerCase().replace(/[\s_\-]/g,``)),r=t.findIndex(e=>n.includes(e));return r>=0?r:t.findIndex(e=>n.some(t=>e===t||e.startsWith(t)))},i=r(`taskid`,`id`,`code`,`uid`,`wbs`),a=r(`taskname`,`activityname`,`name`,`activity`,`description`,`title`);a===i&&(a=t.findIndex((e,t)=>t!==i&&(e.includes(`name`)||e.includes(`desc`)||e.includes(`act`))));let l=r(`startdate`,`start`,`targetstart`,`earlystart`),u=r(`finishdate`,`finish`,`enddate`,`end`,`targetend`,`earlyfinish`),d=r(`totalcost`,`cost`,`budget`,`amount`,`total`),f=r(`unitcost`,`unitrate`,`rate`),p=r(`category`,`trade`,`discipline`,`type`),m=r(`status`,`state`,`progress`),h=r(`expressids`,`elementids`,`ids`,`elements`),g=r(`tasknesting`,`outlinelevel`,`nesting`,`level`,`indent`),_=[],v=0;for(let t=1;t<e.length;t++){let n=e[t];if(!n||n.length===0)continue;let r=i>=0&&n[i]?String(n[i]).trim():`task-${t}`,y=a>=0&&n[a]?String(n[a]).trim():`Task ${r}`,b=l>=0?o(n[l]):``,x=u>=0?o(n[u]):``;if(!b||!x)continue;let S=d>=0?s(n[d]):0,C=f>=0?s(n[f]):S>0?S:0,w=p>=0&&n[p]?String(n[p]).trim():`IFCELEMENT`,T=m>=0&&n[m]?String(n[m]).trim():`Planned`,E=/complete/i.test(T)?`Completed`:/progress|active/i.test(T)?`In Progress`:`Planned`,D=new Set;h>=0&&n[h]&&String(n[h]).split(/[;,|]/).forEach(e=>{let t=s(e);t>0&&D.add(t)});let O,k,A;if(g>=0&&n[g]!==void 0&&n[g]!==``){let e=Math.max(0,Math.round(s(n[g])));for(O=e+1;_.length>0&&_[_.length-1].level>=e;)_.pop();if(_.length>0){k=_[_.length-1].id;let t=_[_.length-1].wbsParts,n=c.filter(e=>e.parentId===k).length+1,i=[...t,n];A=i.join(`.`),_.push({level:e,id:r,wbsParts:i})}else{v++;let t=[v];A=t.join(`.`),_.push({level:e,id:r,wbsParts:t})}}c.push({id:r,name:y,category:w,startDate:b,endDate:x,status:E,modelId:``,elementIds:D,unitCost:C,totalCost:S||C*Math.max(1,D.size),quantity:Math.max(1,D.size),wbsCode:A,parentId:k,outlineLevel:O,simulationKey:y})}g>=0&&c.length>0&&n(c)}}return{tasks:c,format:`EXCEL_WORKBOOK`,projectName:t.replace(/\.[^/.]+$/,``)}}static parseIfcWorkSchedule(e,r=`default-model`){let i={tasks:[],format:`IFC4_WORKSCHEDULE`,projectName:`IFC4 WorkSchedule`};if(!e)return i;let a=e.replace(/\r?\n/g,` `).split(`;`),o=e=>e.split(`,`).map(e=>parseInt(e.replace(/#/g,``).trim(),10)).filter(e=>Number.isFinite(e)),s=e=>{let t=[],n=``,r=0,i=!1;for(let a=0;a<e.length;a++){let o=e[a];if(o===`'`&&(i=!i),!i){if(o===`(`)r++;else if(o===`)`)r--;else if(o===`,`&&r===0){t.push(n.trim()),n=``;continue}}n+=o}return n.trim().length>0&&t.push(n.trim()),t},c=e=>{if(!e||e===`$`)return``;let t=e.trim();return t.startsWith(`'`)&&t.endsWith(`'`)&&t.length>=2?t.slice(1,-1).trim():t},l=e=>{let t=c(e).toUpperCase();if(!t)return 0;let n=t.match(/P(?:(\d+)W)?(?:(\d+)D)?/),r=t.match(/T(?:(\d+)H)?/),i=n?.[1]?parseInt(n[1],10):0,a=n?.[2]?parseInt(n[2],10):0,o=r?.[1]?parseInt(r[1],10):0;return i*7+a+Math.round(o/8)},u=e=>{if(!e)return null;let t=e.match(/#(\d+)/);return t?parseInt(t[1],10):null},d=new Map,f=new Map,p=[],m=new Map,h=new Map,g=`IFC4 WorkSchedule`;for(let e of a){let t=e.trim().match(/^#(\d+)\s*=\s*(IFC[A-Z0-9_]+)\s*\((.*)\)$/i);if(!t)continue;let n=parseInt(t[1],10),r=t[2].toUpperCase(),i=s(t[3]);if(r===`IFCWORKSCHEDULE`||r===`IFCWORKPLAN`){let e=c(i[2]);e&&r===`IFCWORKSCHEDULE`&&(g=e)}else if(r===`IFCTASKTIME`){let e=l(i[3]),t=c(i[4]).split(`T`)[0],r=c(i[5]).split(`T`)[0],a=c(i[6]).split(`T`)[0],o=c(i[7]).split(`T`)[0],s=c(i[8]).split(`T`)[0],u=c(i[9]).split(`T`)[0],f=i[10]&&i[10]!==`$`?l(i[10]):void 0,p=i[11]&&i[11]!==`$`?l(i[11]):void 0,m=i[12]===`.T.`,h=c(i[13]).split(`T`)[0],g=c(i[15]).split(`T`)[0],_=c(i[16]).split(`T`)[0];d.set(n,{scheduleDurationDays:e||void 0,scheduleStart:t||void 0,scheduleFinish:r||void 0,earlyStart:a||void 0,earlyFinish:o||void 0,lateStart:s||void 0,lateFinish:u||void 0,freeFloatDays:f,totalFloatDays:p,isCritical:m,statusTime:h||void 0,actualStart:g||void 0,actualFinish:_||void 0})}else if(r===`IFCTASK`){let e=c(i[0])||`ifc-task-${n}`,t=c(i[2])||c(i[5])||`IFC Task #${n}`,r=c(i[5])||String(n),a=c(i[7]).toLowerCase(),o=a.includes(`complete`)||a.includes(`done`)?`Completed`:a.includes(`progress`)||a.includes(`started`)||a.includes(`active`)?`In Progress`:`Planned`,s=parseInt(i[10]||`50`,10)||50,l=u(i[11]);f.set(n,{stepId:n,guid:e,name:t,identification:r,status:o,taskTimeId:l,priority:s})}else if(r===`IFCRELSEQUENCE`){let e=u(i[4]),t=u(i[5]),n=(i[7]||`.FINISH_START.`).toUpperCase(),r=`FS`;n.includes(`START_START`)?r=`SS`:n.includes(`FINISH_FINISH`)?r=`FF`:n.includes(`START_FINISH`)&&(r=`SF`);let a=l(i[6]);e&&t&&p.push({predId:e,succId:t,type:r,lagDays:a})}else if(r===`IFCRELNESTS`){let e=u(i[4]),t=i[5]?.replace(/^\(|\)$/g,``)??``;if(e&&t)for(let n of o(t))m.set(n,e)}else if(r===`IFCRELASSIGNSTOPROCESS`){let e=i[4]?.replace(/^\(|\)$/g,``)??``,t=u(i[6]);if(t&&e){h.has(t)||h.set(t,new Set);let n=h.get(t);for(let t of o(e))n.add(t)}}}let _=[],v=new Date().toISOString().split(`T`)[0],y=new Map;for(let e of f.values())y.set(e.stepId,`ifc-task-${e.stepId}`);let b=new Map;for(let e of p){let t=y.get(e.predId);t&&(b.has(e.succId)||b.set(e.succId,[]),b.get(e.succId).push({predecessorId:t,type:e.type,lagDays:e.lagDays}))}for(let e of f.values()){let t=e.taskTimeId?d.get(e.taskTimeId):void 0,n=t?.scheduleStart||t?.earlyStart||v,i=new Date((Date.parse(n)||Date.now())+Math.max(1,t?.scheduleDurationDays??1)*864e5).toISOString().split(`T`)[0],a=t?.scheduleFinish||t?.earlyFinish||i,o=h.get(e.stepId)??new Set,s=m.get(e.stepId),c=s?y.get(s):void 0,l=b.get(e.stepId);_.push({id:`ifc-task-${e.stepId}`,name:e.name,category:this.guessCategoryFromName(e.name),startDate:n,endDate:a,actualStartDate:t?.actualStart,actualEndDate:t?.actualFinish,earlyStart:t?.earlyStart,earlyFinish:t?.earlyFinish,lateStart:t?.lateStart,lateFinish:t?.lateFinish,totalFloat:t?.totalFloatDays,freeFloat:t?.freeFloatDays,isCritical:t?.isCritical,status:e.status,elementIds:o,modelId:r,unitCost:0,quantity:o.size,wbsCode:e.identification,parentId:c,predecessors:l&&l.length>0?l:void 0,simulationKey:e.name})}if(_.length>0){let e=t(_);for(let t of _){let n=e.results.get(t.id);n&&(t.earlyStart=t.earlyStart||n.earlyStart,t.earlyFinish=t.earlyFinish||n.earlyFinish,t.lateStart=t.lateStart||n.lateStart,t.lateFinish=t.lateFinish||n.lateFinish,t.totalFloat===void 0&&(t.totalFloat=n.totalFloatDays),t.freeFloat===void 0&&(t.freeFloat=n.freeFloatDays),t.isCritical===void 0&&(t.isCritical=n.isCritical),t.outOfSequence=n.outOfSequence)}n(_)}return{tasks:_,format:`IFC4_WORKSCHEDULE`,projectName:g}}};export{a as ScheduleImportParsers};
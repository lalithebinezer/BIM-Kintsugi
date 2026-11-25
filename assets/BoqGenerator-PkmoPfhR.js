import"./BimEngine-DMXqEgyz.js";var e=[`NetArea`,`GrossArea`,`NetVolume`,`GrossVolume`,`Length`,`Width`,`Height`,`Perimeter`,`NetWeight`,`GrossWeight`,`Count`,`Depth`,`NetSideArea`,`GrossSideArea`,`OuterSurfaceArea`,`TotalSurfaceArea`,`CrossSectionArea`],t=[`Material Number`,`MaterialNumber`,`Material_Number`,`Material`,`MaterialName`,`Material Name`,`MaterialType`],n=[`Qty`,`Quantity`,`qty`,`quantity`,`Amount`,`Count`,`Volume`,`Area`,`Length`];function r(r,i){let a=``,o=0,s=``,c=``,l=``,u=[],d=e=>/area/i.test(e)?`m²`:/volume/i.test(e)?`m³`:/length|width|height|depth|perimeter/i.test(e)?`m`:/weight/i.test(e)?`kg`:`ea`;if(i){for(let[t,n]of Object.entries(i))if(/^Qto_/i.test(t))for(let r of e){let e=n[r];if(e!=null&&e!==``){let n=typeof e==`object`&&e.value!==void 0?Number(e.value):Number(e);if(!isNaN(n)&&n>0){let e=d(r);u.push({propertySetName:t,quantityType:r,value:n,unit:e}),o===0&&(o=n,s=r,l=t,c=e)}}}}if(i)for(let[,e]of Object.entries(i)){for(let n of t){let t=e[n];if(t!=null&&t!==``){a=typeof t==`object`&&t.value!==void 0?String(t.value):String(t);break}}if(a)break}if(o===0&&i)for(let[e,t]of Object.entries(i)){for(let r of n){let n=t[r];if(n!=null&&n!==``){let t=typeof n==`object`&&n.value!==void 0?Number(n.value):Number(n);if(!isNaN(t)&&t>0){o=t,s=r,l=e,c=`ea`;break}}}if(o>0)break}if(a===``)for(let e of t){let t=r[e];if(t!=null&&t!==``){a=typeof t==`object`&&t.value!==void 0?String(t.value):String(t);break}}return{materialNumber:a,quantity:o,quantityType:s,unit:c,propertySetName:l,availableQuantities:u}}function i(e,t,n){let r=(e.availableQuantities??[]).find(e=>e.quantityType===t&&(!n||e.propertySetName===n));if(!r)return e;let i=1+(e.wasteFactorPct??0)/100,a=Number((r.value*i).toFixed(3));return{...e,quantity:r.value,grossQuantity:a,unit:r.unit,quantityType:r.quantityType,propertySetName:r.propertySetName,totalCost:Number((a*e.unitCost).toFixed(2))}}function a(e,t=`BIM Kintsugi 5D BOQ`){let n=e=>(e||``).replace(/&/g,`&amp;`).replace(/</g,`&lt;`).replace(/>/g,`&gt;`).replace(/"/g,`&quot;`).replace(/'/g,`&apos;`),r=e=>e===`m³`||e===`m3`?`m3`:e===`m²`||e===`m2`?`m2`:e===`m`?`m`:e===`kg`?`kg`:`St`,i=new Map;for(let t of e.items){let e=t.classificationCode||t.category||`GENERAL`;i.has(e)||i.set(e,[]),i.get(e).push(t)}let a=1,o=[];for(let[e,t]of i){let i=String(a++).padStart(2,`0`),s=1,c=t.map(e=>{let t=`${i}.${String(s++).padStart(3,`0`)}`,a=e.grossQuantity??e.quantity,o=e.propertySetName&&e.quantityType?` [${e.propertySetName}.${e.quantityType}]`:``;return`          <Item ID="I-${e.expressId}" RNoPart="${n(t)}">
            <Qty>${a.toFixed(3)}</Qty>
            <QU>${n(r(e.unit))}</QU>
            <UP>${e.unitCost.toFixed(2)}</UP>
            <IT>${e.totalCost.toFixed(2)}</IT>
            <Description>
              <OutlineText>
                <OutlTxt><TextOutlTxt>${n(e.elementName+o)}</TextOutlTxt></OutlTxt>
              </OutlineText>
            </Description>
          </Item>`}).join(`
`);o.push(`      <BoQCtgy ID="C-${i}" RNoPart="${n(i)}">
        <LblTx>${n(e)}</LblTx>
        <BoQBody>
          <Itemlist>
${c}
          </Itemlist>
        </BoQBody>
      </BoQCtgy>`)}return`<?xml version="1.0" encoding="UTF-8"?>
<GAEB xmlns="http://www.gaeb.de/GAEB_DA_XML/DA83/3.2">
  <GAEBInfo>
    <Version>3.2</Version>
    <ProgSystem>BIM-Kintsugi 5D</ProgSystem>
  </GAEBInfo>
  <Award>
    <DP>83</DP>
    <AwardInfo>
      <Prj>${n(t)}</Prj>
      <Cur>USD</Cur>
    </AwardInfo>
    <BoQ ID="BOQ-1">
      <BoQBkdn><Type>BoQLevel</Type><Length>2</Length></BoQBkdn>
      <BoQBody>
${o.join(`
`)}
      </BoQBody>
    </BoQ>
  </Award>
</GAEB>`}function o(e){let t=new Map,n=0;for(let r of e){n+=r.totalCost;let e=t.get(r.category)||{count:0,totalCost:0};e.count+=1,e.totalCost+=r.totalCost,t.set(r.category,e)}return{items:e,totalCost:n,totalElements:e.length,categorySummary:t}}function s(e,t){let n=[`Express ID`,`Model ID`,`IFC Category`,`Element Name`,`Material Number`,`Property Set`,`Quantity Type`,`Unit`,`Quantity`,`Unit Cost ($)`,`Total Cost ($)`],r=e.items.map(e=>[e.expressId,e.modelId,e.category,`"${e.elementName.replace(/"/g,`""`)}"`,`"${e.materialNumber.replace(/"/g,`""`)}"`,e.propertySetName,e.quantityType,e.unit,e.quantity.toFixed(3),e.unitCost.toFixed(2),e.totalCost.toFixed(2)]);r.push([]),r.push([`=== CATEGORY SUMMARY ===`]),r.push([`Category`,``,``,``,``,``,``,``,`Elements`,``,`Total Cost ($)`]);for(let[t,n]of e.categorySummary)r.push([t,``,``,``,``,``,``,``,n.count,``,n.totalCost.toFixed(2)]);r.push([]),r.push([`GRAND TOTAL`,``,``,``,``,``,``,``,e.totalElements,``,e.totalCost.toFixed(2)]);let i=[n.join(`,`),...r.map(e=>e.join(`,`))].join(`
`),a=new Blob([i],{type:`text/csv;charset=utf-8;`}),o=URL.createObjectURL(a),s=document.createElement(`a`);s.href=o,s.download=t||`BOQ_Export_${new Date().toISOString().split(`T`)[0]}.csv`,document.body.appendChild(s),s.click(),document.body.removeChild(s),URL.revokeObjectURL(o)}var c={IFCWALL:185,IFCWALLSTANDARDCASE:185,IFCSLAB:240,IFCCOLUMN:420,IFCBEAM:390,IFCFOOTING:310,IFCDOOR:650,IFCWINDOW:480,IFCROOF:215,IFCSTAIR:1200,IFCDUCTSEGMENT:145,IFCPIPESEGMENT:95};function l(e,t=0){if(t>0)return t;let n=e.toUpperCase();for(let[e,t]of Object.entries(c))if(n.includes(e))return t;return 125}export{l as a,o as i,s as n,i as o,r,a as t};
const CFG = {
  SHEET_ID:'19zU7VM1u5KZjdx6Y1aUOLEn26MJtBANyLpF1w9iJt8k',
  APP_ID:'MODU_2026_2_GENERALTECH',
  QUERY:'("모두의창업" OR "모두의 창업") -in:spam -in:trash',
  NOTICE_FOLDER:'13ae9p8gVIzDwFkDEj5RVC2KPre7d7YXH',
  SUBMISSION_FOLDER:'1VfC-HvkfouJRzaYmHG-a9K1T0virUMd_',
  TZ:'Asia/Seoul'
};

function setupModooStartupAgent(){
  const monitor=runModooStartupMonitor();
  const trigger=installHourlyTrigger();
  return {monitor,trigger,readback:getModooStartupReadback()};
}

function runModooStartupMonitor(){
  const started=new Date();
  let ss,reads=0,writes=0;
  try{
    ss=SpreadsheetApp.openById(CFG.SHEET_ID);
    const log=sheet_(ss,'10_MAIL_LOG');
    const attLog=sheet_(ss,'11_ATTACHMENT_LOG');
    const known=idSet_(log);
    const threads=GmailApp.search(CFG.QUERY,0,100);
    reads=threads.length;
    const items=[];
    threads.forEach(t=>t.getMessages().forEach(m=>items.push({t,m})));
    items.sort((a,b)=>a.m.getDate()-b.m.getDate());
    items.forEach(x=>{
      const m=x.m,id=m.getId();
      if(known.has(id)) return;
      const subject=m.getSubject()||'', body=m.getPlainBody()||'';
      const text=subject+'\n'+body, category=classify_(text);
      const deadline=deadline_(text,m.getDate());
      const atts=m.getAttachments({includeInlineImages:false,includeAttachments:true})||[];
      const target=(category==='RESULT'||category==='RECEIPT')?CFG.SUBMISSION_FOLDER:CFG.NOTICE_FOLDER;
      const links=[];
      atts.forEach(a=>{
        try{
          const prefix=Utilities.formatDate(m.getDate(),CFG.TZ,'yyyyMMdd_HHmmss');
          const f=DriveApp.getFolderById(target).createFile(a.copyBlob()).setName(prefix+'_'+safe_(a.getName()||'attachment'));
          links.push(f.getUrl());
          attLog.appendRow([id,m.getDate(),m.getFrom(),subject,a.getName(),a.getContentType(),a.getSize(),f.getId(),f.getUrl(),category,'SAVED',new Date(),'','','']);
          writes++;
        }catch(e){
          attLog.appendRow([id,m.getDate(),m.getFrom(),subject,a.getName(),a.getContentType(),a.getSize(),'','',category,'SAVE_FAILED',new Date(),String(e),'','']);
        }
      });
      log.appendRow([id,x.t.getId(),fmt_(m.getDate()),m.getFrom(),subject,category,priority_(category,deadline),deadline,summary_(body,category,deadline),atts.length,(target===CFG.SUBMISSION_FOLDER?'06_제출본_결과피드백':'00_공지_일정'),links.join('\n'),'AUTO_RECORDED',action_(category),fmt_(new Date())]);
      updateApp_(ss,id,m,text,category,deadline);
      if(['RESULT','RECEIPT','ACTION_REQUIRED'].includes(category)) task_(ss,id,category,subject,deadline);
      known.add(id); writes++;
    });
    autoLog_(ss,started,'PASS',reads,writes,'','Gmail import + Drive attachments + application state');
    return {status:'PASS',threadsRead:reads,writes};
  }catch(e){
    if(ss) try{autoLog_(ss,started,'FAIL',reads,writes,String(e),'monitor failed');}catch(_){}
    throw e;
  }
}

function installHourlyTrigger(){
  const fn='runModooStartupMonitor';
  ScriptApp.getProjectTriggers().filter(t=>t.getHandlerFunction()===fn).forEach(t=>ScriptApp.deleteTrigger(t));
  const t=ScriptApp.newTrigger(fn).timeBased().everyHours(1).create();
  const ss=SpreadsheetApp.openById(CFG.SHEET_ID);
  autoLog_(ss,new Date(),'PASS',0,1,'','Hourly trigger '+t.getUniqueId());
  return {status:'PASS',handler:fn,triggerId:t.getUniqueId()};
}

function getModooStartupReadback(){
  const ss=SpreadsheetApp.openById(CFG.SHEET_ID);
  const app=sheet_(ss,'60_APPLICATION_REGISTRY').getRange(2,1,1,20).getDisplayValues()[0];
  return {applicationId:app[0],itemName:app[4],status:app[9],receiptNo:app[11],result:app[13],nextTask:app[16],mailRows:Math.max(0,sheet_(ss,'10_MAIL_LOG').getLastRow()-1),taskRows:Math.max(0,sheet_(ss,'30_TASK_QUEUE').getLastRow()-1),automationRows:Math.max(0,sheet_(ss,'80_AUTOMATION_LOG').getLastRow()-1),triggers:ScriptApp.getProjectTriggers().map(t=>({handler:t.getHandlerFunction(),id:t.getUniqueId()}))};
}

function sheet_(ss,n){const s=ss.getSheetByName(n);if(!s)throw new Error('Missing sheet '+n);return s;}
function idSet_(s){if(s.getLastRow()<2)return new Set();return new Set(s.getRange(2,1,s.getLastRow()-1,1).getDisplayValues().flat().filter(Boolean));}
function fmt_(d){return Utilities.formatDate(d,CFG.TZ,'yyyy-MM-dd HH:mm:ss z');}
function safe_(s){return String(s).replace(/[\\/:*?"<>|]/g,'_').substring(0,150);}
function classify_(t){if(/(미선정|불합격|선정결과|평가결과|심사결과|합격|선정)/.test(t))return 'RESULT';if(/(접수\s*완료|신청\s*완료|접수번호|신청번호|정상\s*접수)/.test(t))return 'RECEIPT';if(/(보완|수정\s*요청|추가\s*제출|소명)/.test(t))return 'ACTION_REQUIRED';if(/(마감|D-\d|모집|공고|도전)/i.test(t))return 'NOTICE';return 'INFO';}
function deadline_(t,received){t=String(t).replace(/\s+/g,' ');let m=t.match(/(20\d{2})\s*년\s*(\d{1,2})\s*월\s*(\d{1,2})\s*일[^0-9]{0,20}(\d{1,2})\s*(?:시|:)\s*(\d{2})?/);if(m)return dl_(+m[1],+m[2],+m[3],+m[4],+(m[5]||0));m=t.match(/['’]?(20)?(\d{2})[.\-/](\d{1,2})[.\-/](\d{1,2})[^0-9]{0,20}(\d{1,2})(?::|시)\s*(\d{2})?/);if(m)return dl_(+(m[1]?m[1]+m[2]:'20'+m[2]),+m[3],+m[4],+m[5],+(m[6]||0));m=t.match(/~?\s*(\d{1,2})[.\-/](\d{1,2})[^0-9]{0,20}(\d{1,2})\s*시/);return m?dl_(received.getFullYear(),+m[1],+m[2],+m[3],0):'';}
function dl_(y,m,d,h,min){return Utilities.formatDate(new Date(y,m-1,d,h||23,min||59),CFG.TZ,'yyyy-MM-dd HH:mm')+' KST';}
function priority_(c,d){if(['RESULT','RECEIPT','ACTION_REQUIRED'].includes(c))return 'URGENT';if(!d)return 'NORMAL';return 'HIGH';}
function summary_(b,c,d){return '['+c+']'+(d?' 마감 '+d+'.':'')+' '+String(b).replace(/\s+/g,' ').trim().substring(0,280);}
function action_(c){return c==='RESULT'?'결과판정→다음라운드':c==='RECEIPT'?'접수증확인':c==='ACTION_REQUIRED'?'보완즉시처리':c==='NOTICE'?'공고/마감확인':'정보기록';}

function updateApp_(ss,mailId,msg,text,c,d){
  const s=sheet_(ss,'60_APPLICATION_REGISTRY'),v=s.getDataRange().getDisplayValues();let r=-1;
  for(let i=1;i<v.length;i++)if(v[i][0]===CFG.APP_ID){r=i+1;break;}if(r<0)return;
  s.getRange(r,18).setValue(mailId);s.getRange(r,19).setValue(fmt_(new Date()));if(d&&!s.getRange(r,9).getDisplayValue())s.getRange(r,9).setValue(d);
  if(c==='RECEIPT'){const no=(text.match(/(?:접수번호|신청번호)\s*[:：]?\s*([A-Za-z0-9_-]{4,40})/)||[])[1]||'';s.getRange(r,10).setValue('SUBMITTED');s.getRange(r,11).setValue(fmt_(msg.getDate()));if(no)s.getRange(r,12).setValue(no);s.getRange(r,17).setValue('접수증 readback→심사결과 감시');}
  else if(c==='RESULT'){const neg=/(미선정|불합격)/.test(text),pos=!neg&&/(선정|합격)/.test(text);const result=neg?'NOT_SELECTED':pos?'SELECTED':'RESULT_RECEIVED';s.getRange(r,14).setValue(result);s.getRange(r,15).setValue(fmt_(msg.getDate()));s.getRange(r,10).setValue(result);s.getRange(r,17).setValue(result==='SELECTED'?'다음라운드 요구사항→MVP/멘토링 과제':'원인분석→보완→재도전 과제');}
  else if(c==='ACTION_REQUIRED'){s.getRange(r,10).setValue('ACTION_REQUIRED');s.getRange(r,17).setValue('보완요청 기한 내 처리');}
}
function task_(ss,id,c,subject,d){const s=sheet_(ss,'30_TASK_QUEUE'),tid='AUTO_MAIL_'+id;if(s.getLastRow()>1&&s.getRange(2,1,s.getLastRow()-1,1).getDisplayValues().flat().includes(tid))return;s.appendRow([tid,c,CFG.APP_ID,subject,'READY','NOT_REQUIRED','CRITICAL',fmt_(new Date()),d||'','','',fmt_(new Date())]);}
function autoLog_(ss,start,status,reads,writes,error,evidence){sheet_(ss,'80_AUTOMATION_LOG').appendRow(['RUN_'+Utilities.formatDate(start,CFG.TZ,'yyyyMMdd_HHmmss_SSS'),'runModooStartupMonitor','TIME_HOURLY_OR_MANUAL',fmt_(start),fmt_(new Date()),status,reads,writes,error||'',evidence||'','NEXT_HOURLY_WAKE','검색→기록→수정→테스트→readback→PASS/FAIL 로그','']);}

/*
@license

dhtmlxGantt v.3.1.0 Stardard
This software is covered by DHTMLX Commercial License. Usage without proper license is prohibited.

(c) Dinamenta, UAB.
*/
gantt.config.quickinfo_buttons=["icon_delete","icon_edit"],gantt.config.quick_info_detached=!0,gantt.config.show_quick_info=!0,gantt.attachEvent("onTaskClick",function(t){return gantt.showQuickInfo(t),!0}),function(){for(var t=["onEmptyClick","onViewChange","onLightbox","onBeforeTaskDelete","onBeforeDrag"],e=function(){return gantt._hideQuickInfo(),!0},n=0;n<t.length;n++)gantt.attachEvent(t[n],e)}(),gantt.templates.quick_info_title=function(t,e,n){return n.text.substr(0,50)},gantt.templates.quick_info_content=function(t,e,n){return n.details||n.text
},gantt.templates.quick_info_date=function(t,e,n){return gantt.templates.task_time(t,e,n)},gantt.templates.quick_info_class=function(){return""},gantt.showQuickInfo=function(t){if(t!=this._quick_info_box_id&&this.config.show_quick_info){this.hideQuickInfo(!0);var e=this._get_event_counter_part(t);e&&(this._quick_info_box=this._init_quick_info(e,t),this._quick_info_box.className=gantt._prepare_quick_info_classname(t),this._fill_quick_data(t),this._show_quick_info(e))}},gantt._hideQuickInfo=function(){gantt.hideQuickInfo()
},gantt.hideQuickInfo=function(t){var e=this._quick_info_box;if(this._quick_info_box_id=0,e&&e.parentNode){if(gantt.config.quick_info_detached)return e.parentNode.removeChild(e);e.className+=" gantt_qi_hidden","auto"==e.style.right?e.style.left="-350px":e.style.right="-350px",t&&e.parentNode.removeChild(e)}},dhtmlxEvent(window,"keydown",function(t){27==t.keyCode&&gantt.hideQuickInfo()}),gantt._show_quick_info=function(t){var e=gantt._quick_info_box;if(gantt.config.quick_info_detached){e.parentNode&&"#document-fragment"!=e.parentNode.nodeName.toLowerCase()||gantt.$task_data.appendChild(e);
var n=e.offsetWidth,i=e.offsetHeight,a=this.getScrollState(),s=this.$task.offsetWidth+a.x-n;e.style.left=Math.min(Math.max(a.x,t.left-t.dx*(n-t.width)),s)+"px",e.style.top=t.top-(t.dy?i:-t.height)-25+"px"}else e.style.top="20px",1==t.dx?(e.style.right="auto",e.style.left="-300px",setTimeout(function(){e.style.left="-10px"},1)):(e.style.left="auto",e.style.right="-300px",setTimeout(function(){e.style.right="-10px"},1)),e.className+=" gantt_qi_"+(1==t.dx?"left":"right"),gantt._obj.appendChild(e)},gantt._prepare_quick_info_classname=function(t){var e=gantt.getTask(t),n="gantt_cal_quick_info",i=this.templates.quick_info_class(e.start_date,e.end_date,e);
return i&&(n+=" "+i),n},gantt._init_quick_info=function(t,e){var n=gantt.getTask(e);if("boolean"==typeof this._quick_info_readonly&&this._is_readonly(n)!==this._quick_info_readonly&&(gantt.hideQuickInfo(!0),this._quick_info_box=null),this._quick_info_readonly=this._is_readonly(n),!this._quick_info_box){var i=this._quick_info_box=document.createElement("div"),a='<div class="gantt_cal_qi_title"><div class="gantt_cal_qi_tcontent"></div><div  class="gantt_cal_qi_tdate"></div></div><div class="gantt_cal_qi_content"></div>';
a+='<div class="gantt_cal_qi_controls">';for(var s=gantt.config.quickinfo_buttons,r={icon_delete:!0,icon_edit:!0},o=0;o<s.length;o++)this._quick_info_readonly&&r[s[o]]||(a+='<div class="gantt_qi_big_icon '+s[o]+'" title="'+gantt.locale.labels[s[o]]+"\"><div class='gantt_menu_icon "+s[o]+"'></div><div>"+gantt.locale.labels[s[o]]+"</div></div>");a+="</div>",i.innerHTML=a,dhtmlxEvent(i,"click",function(t){t=t||event,gantt._qi_button_click(t.target||t.srcElement)}),gantt.config.quick_info_detached&&dhtmlxEvent(gantt.$task_data,"scroll",function(){gantt.hideQuickInfo()
})}return this._quick_info_box},gantt._qi_button_click=function(t){var e=gantt._quick_info_box;if(t&&t!=e){var n=t.className;if(-1!=n.indexOf("_icon")){var i=gantt._quick_info_box_id;gantt.$click.buttons[n.split(" ")[1].replace("icon_","")](i)}else gantt._qi_button_click(t.parentNode)}},gantt._get_event_counter_part=function(t){for(var e=gantt.getTaskNode(t),n=0,i=0,a=e;a&&"gantt_task"!=a.className;)n+=a.offsetLeft,i+=a.offsetTop,a=a.offsetParent;var s=this.getScrollState();if(a){var r=n+e.offsetWidth/2-s.x>gantt._x/2?1:0,o=i+e.offsetHeight/2-s.y>gantt._y/2?1:0;
return{left:n,top:i,dx:r,dy:o,width:e.offsetWidth,height:e.offsetHeight}}return 0},gantt._fill_quick_data=function(t){var e=gantt.getTask(t),n=gantt._quick_info_box;gantt._quick_info_box_id=t;var i=n.firstChild.firstChild;i.innerHTML=gantt.templates.quick_info_title(e.start_date,e.end_date,e);var a=i.nextSibling;a.innerHTML=gantt.templates.quick_info_date(e.start_date,e.end_date,e);var s=n.firstChild.nextSibling;s.innerHTML=gantt.templates.quick_info_content(e.start_date,e.end_date,e)};
//# sourceMappingURL=../sources/ext/dhtmlxgantt_quick_info.js.map
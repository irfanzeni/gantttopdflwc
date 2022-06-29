/*
@license

dhtmlxGantt v.4.0.11 Professional
This software is covered by DHTMLX Enterprise License. Usage without proper license is prohibited.

(c) Dinamenta, UAB.
*/
Gantt.plugin(function(t){t._tooltip={},t._tooltip_class="gantt_tooltip",t.config.tooltip_timeout=30,t.config.tooltip_offset_y=20,t.config.tooltip_offset_x=10,t._create_tooltip=function(){return this._tooltip_html||(this._tooltip_html=document.createElement("div"),this._tooltip_html.className=t._tooltip_class),this._tooltip_html},t._is_cursor_under_tooltip=function(t,e){return t.x>=e.pos.x&&t.x<=e.pos.x+e.width?!0:t.y>=e.pos.y&&t.y<=e.pos.y+e.height?!0:!1},t._show_tooltip=function(e,i){if(!t.config.touch||t.config.touch_tooltip){
var n=this._create_tooltip();n.innerHTML=e,t.$task_data.appendChild(n);var a=n.offsetWidth+20,s=n.offsetHeight+40,r=this.$task.offsetHeight,o=this.$task.offsetWidth,_=this.getScrollState();i.y+=_.y;var l={x:i.x,y:i.y};i.x+=1*t.config.tooltip_offset_x||0,i.y+=1*t.config.tooltip_offset_y||0,i.y=Math.min(Math.max(_.y,i.y),_.y+r-s),i.x=Math.min(Math.max(_.x,i.x),_.x+o-a),t._is_cursor_under_tooltip(l,{pos:i,width:a,height:s})&&(l.x+a>o+_.x&&(i.x=l.x-(a-20)-(1*t.config.tooltip_offset_x||0)),l.y+s>r+_.y&&(i.y=l.y-(s-40)-(1*t.config.tooltip_offset_y||0))),
n.style.left=i.x+"px",n.style.top=i.y+"px"}},t._hide_tooltip=function(){this._tooltip_html&&this._tooltip_html.parentNode&&this._tooltip_html.parentNode.removeChild(this._tooltip_html),this._tooltip_id=0},t._is_tooltip=function(e){var i=e.target||e.srcElement;return t._is_node_child(i,function(t){return t.className==this._tooltip_class})},t._is_task_line=function(e){var i=e.target||e.srcElement;return t._is_node_child(i,function(t){return t==this.$task_data})},t._is_node_child=function(e,i){for(var n=!1;e&&!n;)n=i.call(t,e),
e=e.parentNode;return n},t._tooltip_pos=function(e){if(e.pageX||e.pageY)var i={x:e.pageX,y:e.pageY};var n=t.env.isIE?document.documentElement:document.body,i={x:e.clientX+n.scrollLeft-n.clientLeft,y:e.clientY+n.scrollTop-n.clientTop},a=t._get_position(t.$task_data);return i.x=i.x-a.x,i.y=i.y-a.y,i},t.attachEvent("onMouseMove",function(e,i){if(this.config.tooltip_timeout){document.createEventObject&&!document.createEvent&&(i=document.createEventObject(i));var n=this.config.tooltip_timeout;this._tooltip_id&&!e&&(isNaN(this.config.tooltip_hide_timeout)||(n=this.config.tooltip_hide_timeout)),
clearTimeout(t._tooltip_ev_timer),t._tooltip_ev_timer=setTimeout(function(){t._init_tooltip(e,i)},n)}else t._init_tooltip(e,i)}),t._init_tooltip=function(t,e){if(!this._is_tooltip(e)&&(t!=this._tooltip_id||this._is_task_line(e))){if(!t)return this._hide_tooltip();this._tooltip_id=t;var i=this.getTask(t),n=this.templates.tooltip_text(i.start_date,i.end_date,i);return n?void this._show_tooltip(n,this._tooltip_pos(e)):void this._hide_tooltip()}},t.attachEvent("onMouseLeave",function(e){t._is_tooltip(e)||this._hide_tooltip();
}),t.templates.tooltip_date_format=t.date.date_to_str("%Y-%m-%d"),t.templates.tooltip_text=function(e,i,n){return"<b>Task:</b> "+n.text+"<br/><b>Start date:</b> "+t.templates.tooltip_date_format(e)+"<br/><b>End date:</b> "+t.templates.tooltip_date_format(i)}});
//# sourceMappingURL=../sources/ext/dhtmlxgantt_tooltip.js.map
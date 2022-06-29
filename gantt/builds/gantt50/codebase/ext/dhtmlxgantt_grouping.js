/*!
 * @license
 * 
 * dhtmlxGantt v.5.0.1 Professional
 * This software is covered by DHTMLX Enterprise License. Usage without proper license is prohibited.
 * 
 * (c) Dinamenta, UAB.
 * 
 */
Gantt.plugin(function(t){!function(t){function r(n){if(e[n])return e[n].exports;var i=e[n]={i:n,l:!1,exports:{}};return t[n].call(i.exports,i,i.exports,r),i.l=!0,i.exports}var e={};r.m=t,r.c=e,r.d=function(t,e,n){r.o(t,e)||Object.defineProperty(t,e,{configurable:!1,enumerable:!0,get:n})},r.n=function(t){var e=t&&t.__esModule?function(){return t.default}:function(){return t};return r.d(e,"a",e),e},r.o=function(t,r){return Object.prototype.hasOwnProperty.call(t,r)},r.p="",r(r.s=10)}({10:function(t,r,e){t.exports=e(11)},11:function(r,e){t._groups={relation_property:null,relation_id_property:"$group_id",group_id:null,group_text:null,loading:!1,loaded:0,init:function(t){var r=this;t.attachEvent("onClear",function(){r.clear()}),r.clear();var e=t.$data.tasksStore.getParent;t.$data.tasksStore.getParent=function(n){return r.is_active()?r.get_parent(t,n):e.apply(this,arguments)};var n=t.$data.tasksStore.setParent;t.$data.tasksStore.setParent=function(e,i){if(!r.is_active())return n.apply(this,arguments);if(t.isTaskExists(i)){var a=t.getTask(i);e[r.relation_property]=a[r.relation_id_property]}},t.attachEvent("onBeforeTaskDisplay",function(e,n){return!(r.is_active()&&n.type==t.config.types.project&&!n.$virtual)}),t.attachEvent("onBeforeParse",function(){r.loading=!0}),t.attachEvent("onTaskLoading",function(){return r.is_active()&&--r.loaded<=0&&(r.loading=!1,t.eachTask(t.bind(function(r){this.get_parent(t,r)},r))),!0}),t.attachEvent("onParse",function(){r.loading=!1,r.loaded=0})},get_parent:function(t,r,e){var n=r[this.relation_property];if(void 0!==this._groups_pull[n])return this._groups_pull[n];var i=t.config.root_id;return this.loading||(i=this.find_parent(e||t.getTaskByTime(),n,this.relation_id_property,t.config.root_id),this._groups_pull[n]=i),i},find_parent:function(t,r,e,n){for(var i=0;i<t.length;i++){var a=t[i];if(void 0!==a[e]&&a[e]==r)return a.id}return n},clear:function(){this._groups_pull={},this.relation_property=null,this.group_id=null,this.group_text=null},is_active:function(){return!!this.relation_property},generate_sections:function(r,e){for(var n=[],i=0;i<r.length;i++){var a=t.copy(r[i]);a.type=e,a.open=!0,a.$virtual=!0,a.readonly=!0,a[this.relation_id_property]=a[this.group_id],a.text=a[this.group_text],n.push(a)}return n},clear_temp_tasks:function(t){for(var r=0;r<t.length;r++)t[r].$virtual&&(t.splice(r,1),r--)},generate_data:function(t,r){var e=t.getLinks(),n=t.getTaskByTime();this.clear_temp_tasks(n);var i=[];this.is_active()&&r&&r.length&&(i=this.generate_sections(r,t.config.types.project));var a={links:e};return a.data=i.concat(n),a},update_settings:function(t,r,e){this.clear(),this.relation_property=t,this.group_id=r,this.group_text=e},group_tasks:function(t,r,e,n,i){this.update_settings(e,n,i);var a=this.generate_data(t,r);this.loaded=a.data.length,t._clear_data(),t.parse(a)}},t._groups.init(t),t.groupBy=function(t){t=t||{};var r=t.groups||null,e=t.relation_property||null,n=t.group_id||"key",i=t.group_text||"label";this._groups.group_tasks(this,r,e,n,i)}}})});
//# sourceMappingURL=dhtmlxgantt_grouping.js.map
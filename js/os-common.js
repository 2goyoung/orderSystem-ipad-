if (orderSystem === undefined) { orderSystem = {} }

orderSystem.alert = function (msg, option) {//option :{"title":"提示","btnText":"确定","callback":function(){}}
    if (option !== undefined) {
        var btnText = option.btnText ? option.btnText : "确定";
        var dialogTitle = option.title ? option.title : "提示";
    } else {
        var option = {};
        var btnText =  "确定";
        var dialogTitle =  "提示";
    }
    var htmlStr = '<div class="dialog_main_content"><div class="text-wrap"><div class="text">' + msg + '</div></div></div><a class="btn-ok btn-orange-2">' + btnText + '</a>'
    var dialog = new Dialog({ "type": "html", "vaule": htmlStr }, { "title": dialogTitle }).show();
    dialog.$html.find('.btn-orange-2').one('tap', function () {
        dialog.close(function () {
            if (option.callback !== undefined) {
                option.callback.call(dialog);
            }
        });
        
    })
    return dialog;
}
orderSystem.confirm = function (msg, option) {//option :{"title":"提示","btnOKText":"确定","btnCancelText":"取消","okCallback":function(){},"cancelCallback":function(){}}
    if (option !== undefined) {
        var btnOKText = option.btnOKText ? option.btnOKText : "确定";
        var btnCancelText = option.btnCancelText ? option.btnCancelText : "取消";
        var dialogTitle = option.title ? option.title : "提示";
    } else {
        var option = {};
        var btnOKText = "确定";
        var btnCancelText="取消"
        var dialogTitle = "提示";
    }
    var btnTxtOk = option
    var htmlStr = '<div class="dialog_main_content"><div class="text-wrap"><div class="text">' + msg + '</div></div></div><a class="btn-cancel btn-gray-2">' + btnCancelText + '</a><a class="btn-ok-2 btn-orange-2">' + btnOKText + '</a>'
    var dialog = new Dialog({ "type": "html", "vaule": htmlStr }, { "title": dialogTitle }).show();
    dialog.$html.find('.btn-cancel').one('tap', function () {
        dialog.close(function () {
            if (option.cancelCallback !== undefined) {
                option.cancelCallback.call(dialog);
            }
        });
    })
    dialog.$html.find('.btn-ok-2').one('tap', function () {
        dialog.close(function () {
            
        });
        if (option.okCallback !== undefined) {
            option.okCallback.call(dialog);
        }
    })
    return dialog;
}


//失去焦点缩回键盘
//$('input, textarea').bind('blur', function (e) {
//    window.scrollTo(0, 1);
//});
//$('body').on('tap', function () {
//    $(':focus').blur();
//});

$.fn.animationEnd = function (fun) {
    $(this).one('webkitAnimationEnd', function () {
        fun();
    });
}

//绑定对象上css3动画结束回调
//$('.os-page,#page').bind('webkitAnimationEnd', function (event) {
//    $(this).removeClass('in out pop reverse');
//});

//Page
//注册Url改变处理方法
window.onpopstate = function (e) {
   
}


//页面back
$('.page-back').livequery('tap', function () {
    orderSystem.pages.back();
})

//过滤餐台 状态
$('.select-sub .table-status li').livequery('tap', function () {
    if ($(this).hasClass('active')) { return false; }
    sortData.status = $(this).attr('din-state');
    //改变Tab状态
    $(this).addClass('active').siblings('.active').removeClass('active');
    tableFilter.sort(sortData.status, sortData.contain);
});

//过滤餐台 状态
$('.select-sub .table-contain li').livequery('tap', function () {
    if ($(this).hasClass('active')) { return false; }
    sortData.contain = $(this).attr('din-num');
    //改变Tab状态
    $(this).addClass('active').siblings('.active').removeClass('active');
    tableFilter.sort(sortData.status, sortData.contain);
});

//餐桌过滤对象
var tableFilter = {
    filterObj: {}, 
    sort: function (status, contain, all) {//过滤条件：status（状态）、contain（容量）  过滤操作：all（是否处理全部，布尔值，默认true）
        var self = this;

        //处理上一个没有执行完成的动画
        if (this.filterObj.hasClear !== undefined && !this.filterObj.hasClear) {
            self.endClear();
        }

        var all = all === undefined ? true : all;
        var $currentTableContent = $('.table-content.active').eq(0);
        this.filterObj.hasClear = false;
        this.filterObj.sortTimer = {};
        this.filterObj.sortTimerT = {};
        this.filterObj.sortTimerA = {};
        //复制当前面板，辅助获取最终坐标
        this.filterObj.$clone = $currentTableContent.clone().appendTo($('.table-content-wrap')).css('visibility', 'hidden');
        this.filterObj.$clone.find('li').show();

        //优先处理当前区域，避免动画延迟
        if (contain == "all") {
            if (status == "all") {
                this.filterObj.$filterData = {};
                this.filterObj.$cloneFilterData = this.filterObj.$clone.find('li:not(.justify-fix)');
                this.filterObj.$target = $currentTableContent.find('li').not('.justify-fix');
                var typeCode = 1;
                //$('.table-content:not(.active)').find('li:not(.justify-fix)').removeClass().show();
            }
            else {  
                this.filterObj.$cloneFilterData = this.filterObj.$clone.find('[din-state="' + status + '"]');
                this.filterObj.$filterData = $currentTableContent.find('li').not('.justify-fix,[din-state="' + status + '"]').removeClass('in').addClass('hide-out');
                this.filterObj.$target = $currentTableContent.find('[din-state="' + status + '"]');
                this.filterObj.$clone.find('li').not('.justify-fix,[din-state="' + status + '"]').hide();//将过滤元素display:none; 以获取相关元素最终坐标
                var typeCode = 2;
                //$('.table-content:not(.active) li').not('.justify-fix,[din-state="' + status + '"]').addClass('hide-out').hide();
                //$('.table-content:not(.active)').find('[din-state="' + status + '"]').show();
            }

        }
        else if (status == "all") {
            this.filterObj.$cloneFilterData = this.filterObj.$clone.find('[din-num="' + contain + '"]');
            this.filterObj.$filterData = $currentTableContent.find('li').not('.justify-fix,[din-num="' + contain + '"]').removeClass('in').addClass('hide-out');
            this.filterObj.$target = $currentTableContent.find('[din-num="' + contain + '"]');
            this.filterObj.$clone.find('li').not('.justify-fix,[din-num="' + contain + '"]').hide();
            var typeCode = 3;
            //$('.table-content:not(.active) li').not('.justify-fix,[din-num="' + contain + '"]').addClass('hide-out').hide();
            //$('.table-content:not(.active)').find('[din-num="' + contain + '"]').show();
        }
        else {
            this.filterObj.$cloneFilterData = this.filterObj.$clone.find('[din-state="' + status + '"][din-num="' + contain + '"]');
            this.filterObj.$filterData = $currentTableContent.find('li').not('.justify-fix,[din-state="' + status + '"][din-num="' + contain + '"]').removeClass('in').addClass('hide-out');
            this.filterObj.$target = $currentTableContent.find('[din-state="' + status + '"][din-num="' + contain + '"]');
            this.filterObj.$clone.find('li').not('.justify-fix,[din-state="' + status + '"][din-num="' + contain + '"]').hide();
            var typeCode = 4;
            //$('.table-content:not(.active) li').not('.justify-fix,[din-state="' + status + '"][din-num="' + contain + '"]').addClass('hide-out').hide();
            //$('.table-content:not(.active)').find('[din-state="' + status + '"][din-num="' + contain + '"]').show();
        }

        this.filterObj.$cloneFilterData.show().removeClass('pop out');

        this.filterObj.$visibleTarget = this.filterObj.$target.not('.hide-out').addClass('transition'); //获取在当前场景为显示状态的目标元素

        this.filterObj.$hiddenTarget = this.filterObj.$target.not(this.filterObj.$visibleTarget).show()//将隐藏的显示出来

        //元素定位，当前场景没有显示的元素在最终位置popup出来，已存在场景的元素通过动画平移到最终位置
        $.each(this.filterObj.$target, function (i, n) {
            if ($(this).hasClass('hide-out')) {
                $(this).removeClass('hide-out');
                var y = self.filterObj.$cloneFilterData.eq(i).position().top;
                var x = self.filterObj.$cloneFilterData.eq(i).position().left-10;
                $(this).css({ 'position': 'absolute', 'top': y, 'left': x });
            }
            else {
                var y = self.filterObj.$cloneFilterData.eq(i).position().top - $(this).position().top;
                var x = self.filterObj.$cloneFilterData.eq(i).position().left - $(this).position().left;
                $(this).css({ '-webkit-transform': 'translateX(' + x + 'px) translateY(' + y + 'px)' });
            }
            
        });

        this.filterObj.$hiddenTarget.addClass('pop in reverse').removeClass('out');
        if (!$.isEmptyObject(this.filterObj.$filterData)) {
            this.filterObj.$filterData.addClass('pop out reverse');
        }

        //处理其他区域
        if (all) {
            switch (typeCode) {
                case 1: {
                    $('.table-content:not(.active)').find('li:not(.justify-fix)').removeClass().show();
                    break;
                }
                case 2: {
                    $('.table-content:not(.active) li').not('.justify-fix,[din-state="' + status + '"]').addClass('hide-out').hide();
                    $('.table-content:not(.active)').find('[din-state="' + status + '"]').removeClass('hide-out out').show();
                    break;
                }
                case 3: {
                    $('.table-content:not(.active) li').not('.justify-fix,[din-num="' + contain + '"]').addClass('hide-out').hide();
                    $('.table-content:not(.active)').find('[din-num="' + contain + '"]').removeClass('hide-out out').show();
                    break;
                }
                case 4: {
                    $('.table-content:not(.active) li').not('.justify-fix,[din-state="' + status + '"][din-num="' + contain + '"]').addClass('hide-out').hide();
                    $('.table-content:not(.active)').find('[din-state="' + status + '"][din-num="' + contain + '"]').removeClass('hide-out out').show();
                    break;
                }
            }
        }

        this.filterObj.sortTimer = setTimeout(function () {
            self.endClear();
        },1000);

        this.filterObj.$visibleTarget.first().one('webkitTransitionEnd', function () {
            self.filterObj.sortTimerT = setTimeout(function () {
                self.endClear.call(self);
            }, 200);
        });
        this.filterObj.$hiddenTarget.first().one('webkitAnimationEnd', function () {
            self.filterObj.sortTimerA = setTimeout(function () {
                self.endClear.call(self);
            }, 200);
        });
    },
    endClear: function () {
        if (this.filterObj.hasClear) { return false; }
        this.filterObj.hasClear = true;
        clearTimeout(this.filterObj.sortTimer);
        clearTimeout(this.filterObj.sortTimerT);
        clearTimeout(this.filterObj.sortTimerA);
        this.filterObj.$clone.remove();
        //$('.table-content.active:gt(0)').remove();
        if (!$.isEmptyObject(this.filterObj.$filterData)) {
            this.filterObj.$filterData.hide();
        }
        this.filterObj.$visibleTarget.removeClass('transition');
        this.filterObj.$target.removeClass('pop').removeAttr('style');
        $.each(iscroll.tableList, function () {
            this.refresh();
        });
    }
}

//引导页





//orderSlider.init($('.os-order-content'), 3);

function loadImg(imgObj, callBack) {
    var imgType = /.jpg|.png|.gif|.bmp|.jpeg/i;
    
    try {
        var $img = $(imgObj);
        $img.each(function () {
            if (!$(this).attr('src').match(imgType)) { throw e = { message: "不支持此图片格式" }; }
            if (typeof this.readyState == "undefined") {
               this.onload=function () {
                    return callBack();
                }
            }
            else {
                if (this.readyState == "complete" || this.readyState == "loaded") {
                    return callBack();
                }
                else {
                    this.onreadystatechange = function () {
                        if (this.readyState == "complete" || this.readyState == "loaded") {
                            return callBack();
                        }
                    }
                }
            }
        });
    }
    catch (e) {
        alert("[错误的图片对象]\n原因：" + e.message);
    }
}

//将浮点数四舍五入，取小数点后2位，如果不足2位则补0,这个函数返回的是字符串的格式 
function parsePrice(x) {
    var f = parseFloat(x);
    
    if (isNaN(f)) {
        alert('parse “Price” error');
        return false;
    }
    var f = Math.round(x * 100) / 100;
    var r = f.toString();
    var decimal = r.indexOf('.');
    if (decimal < 0) {
        decimal = r.length;
        r += '.';
    }
    while (r.length <= decimal + 2) {
        r += '0';
    }
    return r;
}


/*
    基于jquery的对话框插件 v1.2.2
    功能：窗口拖动，窗口放大，ajax加载内容，自定义内容结构，关闭窗口回调函数
    Author zhangguoyong@revenco.com
    UI平台 http://172.20.42.5
    ｛
        修改日志：
        （2013.02）
        1.1 修改了窗口最大化时移动窗口会还原到普通状态；
             优化iframe造成窗口拖动卡的现象
             增加关闭窗口回调函数

        （2013.05.04）
        1.2 修改属性btns（true变成['min','max','close']），并根据参数初始化相应功能
              修改属性width、height为外层容器的宽度与高度，不再是主体内容的
              增加属性full,是否全屏打开对话框
              完善对话框定位问题，新增定位属性position
              解决ie6缩小后变形问题
              最大化最小化窗口方法返回窗口对象，不再返回html结构,html结构通过Dialog.$html获取

        （2013.05.11）
        1.2.1 调整show方法的回调函数this指向Dialog对象
                修复部分情况下ie6遮盖层不能展示的bug

         （2013.07.10）
         1.2.2 修正多对话框 背景层重复添加问题
    ｝
*/
var isIE = !!window.ActiveXObject;
var isIE6 = isIE && !window.XMLHttpRequest;
window.Dialog = function (content, options) {
    /// <summary>
    /// 创建窗口会话对象
    /// </summary>
    /// <param name="content">指定窗口类型(type)和内容(content)</param>
    /// <param name="options">窗口属性</param>
    var options = $.extend({}, Dialog.defaults, options);
    var contentType = content === undefined ? 'html' : content.type;
    this.fixed = options.fixed;
    this.positionMode = options.fixed && !isIE6 ? 'fixed' : 'absolute';
    this.width = options.width;
    this.height = options.height;
    this.position = options.position;
    var self = this;
    if (options.id) {
        this.id = options.id;
    }
    else {
        this.id = 'dialog_' + Dialog._count;
    }
    var setHtml = function (content) {

        if ((options.layer == true || options.layer == 'true')) {
            if ($('.dialog_cover').length == 0) {
                self.coverId = 'dialog_cover_' + Dialog._count;
                if (isIE6) {
                    $('<div id="' + self.coverId + '" class="dialog_cover" style="display:none;z-index:' + Dialog._zIndex + ';width:expression(eval(document.documentElement.clientWidth));height:expression(eval(document.documentElement.clientHeight));"><iframe width="100%" height="100%" style="position:absolute;top:0;left:0;scrolling:no;filter:progid:DXImageTransform.Microsoft.Alpha(opacity=0);" frameborder="0" src=""></iframe></div>').appendTo($('body'));
                }
                else {
                    $('<div id="' + self.coverId + '" class="dialog_cover" style="display:none;z-index:' + Dialog._zIndex + ';"></div>').appendTo($('body'));
                }
            } else {
                $('.dialog_cover').css('opacity', '1');
            }
        }

        var btnsHtml = (function () {
            var min = '', max = '', close = '';
            $.each(options.btns, function (i, n) {
                if (n == "close") {
                    close = '<i class="dialog_close"></i>';
                    options.close = true;
                } else if (n == "max") {
                    max = '<i class="dialog_resize"></i>';
                    options.max = true;
                } else if (n == "min") {
                    min = '<i class="dialog_min"></i>';
                    options.min = true;
                }
            })
            return min + max + close;
        })();

        var dialogHtml = ['<div id="' + self.id + '" class="dialog ' + (options.full && options.full != 'false' ? 'full_screen' : '') + '" style="position:' + self.positionMode + ';z-index:' + Dialog._zIndex + ';' + (options.full && options.full != 'false' ? 'width:100%;height:100%;' : 'width:' + options.width + ';height:' + options.height + ';') + '">',
                                        '<div class="dialog_inner">',
                                            '<div class="dialog_bar">',
                                                '<h2 class="dialog_title">' + options.title + '</h2>',
                                                '<div class="dialog_btn">',
                                                    btnsHtml,
                                                '</div>',
                                            '</div>',
                                            '<div class="dialog_content_wrap">',
                                                '<div class="dialog_content">',
                                                    content,
                                                '</div>',
                                            '</div>',
                                        '</div>',
                                    '</div>'].join('');
        return $(dialogHtml).css({ 'opacity': 0 }).appendTo($(options.target));
    };

    switch (contentType) {
        case 'iframe': {
            var contentHtml = '<iframe src="' + content.vaule + '" width="100%" height="100%;" frameborder="no" border="0" marginwidth="0" marginheight="0"  allowtransparency="yes"></iframe>';
            this.dialog = setHtml(contentHtml);
            //处理由于iframe造成拖动卡的问题
            var $iframeFix;
            $(this.dialog).find('.dialog_title').bind('mousedown', function (event) {
                $iframeFix = $('<div class="dialog_iframe_fix"></div>').appendTo($(self.dialog).find('.dialog_content'));
            });
            $(document).mouseup(function (event) {
                if ($iframeFix === undefined) { return false; }
                $iframeFix.remove();
            });
            break;
        }
        case 'ajax': {
            var contentHtml = '<div class="loading"></div>';
            this.dialog = setHtml(contentHtml);
            $.ajax({
                url: content.url,
                data: content.data,
                success: function (contentHtml) {
                    $(self.dialog).find('.dialog_content').html(contentHtml);
                },
                error: function (XMLHttpRequest, textStatus, errorThrown) {
                    if (textStatus == "timeout") { var textStatus = "请求超时,请重新打开窗口" }
                    $(self.dialog).find('.dialog_content').html(textStatus);
                }
            });
            break;
        }
        default:
        case 'html': {
            var contentHtml = content === undefined ? '' : content.vaule;
            this.dialog = setHtml(contentHtml);
            break;
        }
    }

    this.$html = $(this.dialog);
    this.setContentHeight();
    if (options.full) {
        $(window).resize(function () {
            clearTimeout(self.resizeTimer);
            self.resizeTimer = setTimeout(function () {
                self.fullScreen(false);
            }, 100);
        });
    }
    //处理ie6
    if (isIE6) {
        //self.getPadding();
        //$(this.dialog).width(parseInt(options.width) + this.hPadding).height(parseInt(options.height) + this.vPadding);
        var iframe = '<iframe width="100%" height="100%" style="position:absolute;top:0;left:0;scrolling:no;filter:progid:DXImageTransform.Microsoft.Alpha(opacity=0);" frameborder="0" src=""></iframe>';
        $(iframe).prependTo(this.dialog);
    }
    //自动关闭
    if (options.autoClose) {
        alert(options.autoClose);
        setTimeout(function () { self.close(); }, parseInt(options.autoClose));
    }
    //绑定事件
    if (options.close) {
        $(this.dialog).find('.dialog_close').bind('click', function () {
            self.close();
        });
    }
    if (options.min) {
        $(this.dialog).find('.dialog_min').bind('click', function () {
            self.hide();
        });
    }
    if (options.max) {
        //--双击标题栏窗口缩小或放大
        $(this.dialog).find('.dialog_title').bind('dblclick', function () {
            if ($(self.dialog).hasClass('full_screen')) {
                self.normalScreen();
            } else {
                self.fullScreen();
            }
        })[0].onselectstart = function () {
            //--不让标题栏被选择
            return false;
        };

        $(this.dialog).find('.dialog_resize').bind('click', function () {
            if ($(self.dialog).hasClass('full_screen')) {
                self.normalScreen();
            } else {
                self.fullScreen();
            }
        });
    }

    //--拖动事件
    if (options.draggable == true && options.draggable != "false") {
        var mouse = { x: 0, y: 0 };
        $(self.dialog).find('.dialog_title').css('cursor', 'move');
        $(this.dialog).find('.dialog_title').bind('mousedown', function (event) {
            var e = window.event || event;
            mouse.x = e.clientX;
            mouse.y = e.clientY;
            $(document).bind('mousemove', moveDialog);
            return false;
        });
        $(document).mouseup(function (event) {
            $(document).unbind('mousemove', moveDialog);
        });

        function moveDialog(event) {
            var e = window.event || event;

            var top = parseInt($(self.dialog).css('top')) + (e.clientY - mouse.y);
            var left = parseInt($(self.dialog).css('left')) + (e.clientX - mouse.x);

            //ie7 jquery 1.9.1计算出错
            //var top = parseInt($(self.dialog).position().top) + (e.clientY - mouse.y);
            //var left = parseInt($(self.dialog).position().left) + (e.clientX - mouse.x);

            $(self.dialog).css({ top: top, left: left });
            //最大化时移动 窗口还原
            if ($(self.dialog).hasClass('full_screen')) {
                var dialogSize = self.normalScreen();
                var winWidth = $(window).width();
                var left = e.clientX - dialogSize.width * 0.5;
                var ratio = e.clientX / winWidth;
                if (left < 0) {
                    left = 0;
                }
                else if (e.clientX + dialogSize.width * 0.5 > winWidth) {
                    left = winWidth - dialogSize.width;
                }

                self.setPosition(left, e.clientY - mouse.y);
            }
            mouse.x = e.clientX;
            mouse.y = e.clientY;
        };
    }
    //--鼠标按下与松开
    $(this.dialog).bind('mousedown', function () {
        Dialog._zIndex++;
        $(self.dialog).css('zIndex', Dialog._zIndex + 100);
    }).bind('mouseup', function () {
        $(self.dialog).css('zIndex', Dialog._zIndex);
    });

    Dialog._zIndex++;
    Dialog._count++;

    this.setPosition();
    return this;
}
Dialog._zIndex = 500;
Dialog._count = 1;

//设置内容区高度
Dialog.prototype.setContentHeight = function () {
    var $contentWrap = $(this.dialog).find('.dialog_content_wrap');
    if (this.tHeight === undefined) {
        var $dialogTitle = $(this.dialog).find('.dialog_bar');
        this.tHeight = $dialogTitle.height() + parseInt($dialogTitle.css('borderTopWidth') == "medium" ? 0 : $dialogTitle.css('borderTopWidth')) + parseInt($dialogTitle.css('borderBottomWidth') == "medium" ? 0 : $dialogTitle.css('borderBottomWidth'));
    }
    $contentWrap.height($(this.dialog).height() - this.tHeight);
}
//设置会话框位置，差数x为x轴上的偏移值，参数y为y轴上的偏移值，参数为空时，将会话框居中
Dialog.prototype.setPosition = function (x, y) {
    var self = this;
    if (arguments.length == 0) {
        //弹出层是否移动过
        //alert($(this.dialog).css('top'))
        //if ($(this.dialog).css('top') == "auto" && !$(this.dialog).hasClass('full_screen')) {
        if (!$(this.dialog).hasClass('full_screen')) {
            if (typeof this.position == "string" && this.position == "middle") {
                var marginTop = (function () {
                    if (self.fixed) {
                        if (!isIE6) {
                            return $(self.dialog).height() / 2;
                        }
                        else {
                            var height = $(self.dialog).height() / 2;
                            return 'expression(eval(document.documentElement.scrollTop-' + height + '))';
                        }
                    }
                    else {
                        return $(self.dialog).height() / 2 - $(window).scrollTop();
                    }
                })();
                if (typeof marginTop == "string") {
                    $(this.dialog).css({
                        'top': '50%',
                        'left': '50%',
                        'marginLeft': -$(this.dialog).width() / 2 + 'px'
                    });
                    var style = $(this.dialog).attr('style');
                    $(this.dialog).attr('style', style);
                } else {
                    $(this.dialog).css({
                        'top': '50%',
                        'left': '50%',
                        'marginLeft': -$(this.dialog).width() / 2 + 'px'
                    });
                }

            } else {
                $(this.dialog).css(this.position);
            }

        } else {
            $(this.dialog).css({ 'top': 0 + 'px', 'left': 0 + 'px', 'margin': 0 });
        }
    }
    else {
        $(this.dialog).css({ 'top': y + 'px', 'left': x + 'px', 'margin': 0 });
    }
}
//最大化会话框
Dialog.prototype.fullScreen = function (isRecord) {//isRecord 是否保存当前窗口样式
    var self = this;
    this.resizeTimer;
    var winWidth = $(window).width();
    var winHeight = $(window).height();
    if (isRecord === undefined || isRecord)
        this.recordCss = $(this.dialog).attr('style');//记录全屏前窗口样式，用于还原
    $(this.dialog).css({ 'top': 0, 'left': 0, 'width': '100%', 'height': '100%', 'margin': 0 }).addClass('full_screen');
    $(window).resize(function () {
        clearTimeout(self.resizeTimer);
        self.resizeTimer = setTimeout(function () {
            self.fullScreen(false);
        }, 100);
    });
    this.setContentHeight();
    return { 'width': winWidth, 'height': winHeight }
}
//还原窗口大小
Dialog.prototype.normalScreen = function () {
    clearTimeout(this.resizeTimer);
    $(window).unbind('resize');
    if (this.recordCss === undefined) {
        $(this.dialog).css({ 'width': this.width, 'height': this.height, 'left': '50%', 'top': '50%', 'marginTop': -parseInt(this.height, 10) / 2 + 'px', 'marginLeft': -parseInt(this.width, 10) / 2 + 'px' }).removeClass('full_screen');
    }
    else {
        $(this.dialog).attr('style', this.recordCss).removeClass('full_screen');
    }
    this.setContentHeight()
    return { 'width': $(this.dialog).width(), 'height': $(this.dialog).height() }
}
//显示会话框，返回对话框对象
Dialog.prototype.show = function (callback) {
    var self = this;
    
    this.setPosition();
    var marginTop = parseInt($(this.dialog).css('marginTop'), 10);
    if (this.coverId) {
        $('#' + this.coverId).show().css('opacity',1);
    }
    if (marginTop == 0 || marginTop == 'auto') {
        this.inMiddle = false;
        var top = parseInt($(this.dialog).css('top'), 10);
        $(this.dialog).css('top', top - 30).animate({ 'top': top, 'opacity': '1' }, 200, function () { if (callback !== undefined) { callback.call(self); } });
    }
    else {
        this.inMiddle = true;

        $(this.dialog).css({'-webkit-transition':'all .2s ease-in-out', '-webkit-transform': 'translate(0, ' + (-parseInt(this.height, 10) /2) + 'px)', 'opacity': 1 }).one('webkitTransitionEnd', function () { if (callback !== undefined) { callback.call(self); } });
    }
    return this;
}
//关闭对话框，返回对话框对象
Dialog.prototype.close = function (callback) {
    var self = this;

    var closeDialog = function () {
        if (self.coverId) {
            $('#' + self.coverId).css('opacity', 0).one('webkitTransitionEnd', function () {
                if ($(this).css('opacity') == 0) { $(this).remove(); }
            });
        } else if ($('.dialog_cover').length==1) {
            $('.dialog_cover').css('opacity', 0).one('webkitTransitionEnd', function () {
                if ($(this).css('opacity') == 0) { $(this).remove(); }
            });
        }
        if (self.inMiddle) {
            $(self.dialog).css({ '-webkit-transform': 'translate(0, '+(parseInt($(self.dialog).css("marginTop"), 10) - 14)+'px)', 'opacity': '0' }).one('webkitTransitionEnd', function () {
                if (callback !== undefined) { callback(); }
                return $(self.dialog).remove();
            });
        }
        else {
            $(self.dialog).css({ '-webkit-transform': 'translate(0, ' + (parseInt($(self.dialog).css("marginTop"), 10) - 14) + 'px)', 'opacity': '0' }).one('webkitTransitionEnd', function () {
                if (callback !== undefined) { callback(); }
                return $(self.dialog).remove();
            });
        }
    }
    if (this.beforeCloseFun === undefined) {
        closeDialog();
    }
    else {
        if (this.beforeCloseFun() == true) {
            closeDialog();
        }
    }
}
//隐藏对话框，返回对话框对象
Dialog.prototype.hide = function () {
    var self = this;
    $('#' + self.coverId).fadeOut();
    if (self.inMiddle) {
        $(self.dialog).animate({ 'marginTop': parseInt($(self.dialog).css('marginTop'), 10) + 24, 'opacity': '0' }, 400);
    }
    else {
        $(self.dialog).animate({ 'top': parseInt($(self.dialog).css('top'), 10) + 24, 'opacity': '0' }, 400);
    }
    return this;
}
//窗口关闭前触发函数，fun为函数，此方法会阻止窗口关闭
Dialog.prototype.beforeClose = function (fun) {
    if (fun === undefined) {
        this.beforeCloseFun = function () { return 1; }
    }
    else {
        this.beforeCloseFun = fun;
    }
}
Dialog.defaults = {
    title: "&nbsp;",                 //标题文本
    width: '340px',                 //内容框宽度大小，默认为260px
    height: '180px',                //内容框高度大小，默认为150px
    full: false,                        //是否全屏打开
    target: 'body',                 //添加到目标中
    btns: [],  //是否显示最小化最大化按钮
    layer: true,                    //是否有遮盖层
    draggable: false,            // 是否移动 
    autoClose: 0,                //自动关闭时间，单位ms，0 代表不自动关闭
    id: false,                       //窗口id值，没有设置时，由系统自动生成
    fixed: true,                     //对话框固定定位
    position: "middle"          //默认对话框位置 {"left":'10px','top':'10px'}
}

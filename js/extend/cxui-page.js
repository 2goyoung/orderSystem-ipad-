
window.cxuiPage = function (el, options) {
    //默认全局设置
    var defaults = {
        activePageClass: "cxui-page-active",
        animate: true,
        history: true,
        loadingHtml: '<div class="os-loading-bar"><div class="loading-text"></div></div>'
    }
    this.options = $.extend({}, defaults, options);
    this.index = 300;
    //获取page容器对象
    this.$wrap = typeof el == 'object' ? $(el) : $('#' + el);
    this.activePage = {};
    this.pageList = [];
    var pushState = "pushState" in history && "replaceState" in history && (window.navigator.userAgent.search(/CriOS/) === -1);

    //判断loading
    if ($('.' + $(this.options.loadingHtml).attr('class')).length == 0) {
        this.loading = $(this.options.loadingHtml).appendTo($('body'));
    }
    else {
        this.loading = $('.' + $(this.options.loadingHtml).attr('class'));
    }
}
cxuiPage.prototype = {
    ajaxPage: function (url, data, callback, ajaxComplete) {
        var _self = this;
        $.ajax({
            url: url,
            data: data,
            cache: false,//禁用ajax缓存 保证数据实时
            timeout:3000,
            beforeSend: function () {
                _self.timer = setTimeout(function () {
                    _self.loading.show();
                }, 200);
            },
            success: function (ajaxData) {
                _self.loading.hide();
                callback(ajaxData);
            },
            complete: function (XHR, textStatus) {
                clearTimeout(_self.timer);
                return ajaxComplete !== undefined ? ajaxComplete(XHR, textStatus) : '';
            }
        });
    },
    openPage: function (options) {//pageId pagetitle loadingText animateClass loaded preHtml reload
        var _self = this;
        this.index = this.index + 100;
        _self.$wrap.attr("cxpage", options.pageId)
        var $page = $('#' + options.pageId).length == 0 ? $('<div id="' + options.pageId + '">').appendTo(this.$wrap) : $('#' + options.pageId).show();
        $page.css({ 'position': 'absolute', 'top': 0, 'left': 0, 'bottom': 0, 'right': 0, 'overflow': 'hidden', 'zIndex': this.index });
        this.setLoadingText(options.loadingText);
        options.callback = typeof options.callback == "function" ? options.callback : function () { };

        if ($page.html() == "" || options.reload) {
            if (options.loaded || typeof options.loaded == "undefined")//加载后再跳转 
            {
                this.ajaxPage(options.pageUrl, options.pageData, function (ajaxData) {
                    if (typeof options.ajaxCallback == "function") {
                        options.ajaxCallback();
                    }
                    if (_self.options.animate) {
                        $page.addClass(options.animateClass);
                        $page.append($(ajaxData)).one('webkitAnimationEnd', function () {
                            $page.removeClass(options.animateClass);
                            _self.$wrap.attr("cxpage", options.pageId)
                            options.callback();
                        });
                    }
                    else {
                        $page.show();
                        _self.$wrap.attr("cxpage", options.pageId)
                        options.callback();
                    }
                }, function (XHR, textStatus) {
                    if (options.ajaxComplete !== undefined) {
                        options.ajaxComplete(XHR, textStatus);
                    }
                });
            }
            else {//先跳转后加载
                $page.css('backgroundColor', '#fff');
                if (typeof options.preHtml != "undefined") {
                    $page.html(options.preHtml);
                }
                if (_self.options.animate) {
                    $page.addClass(options.animateClass).one('webkitAnimationEnd', function () {
                        _self.ajaxPage(options.pageUrl, options.pageData, function (ajaxData) {
                            $page.html(ajaxData);
                            _self.$wrap.attr("cxpage", options.pageId)
                            options.callback();
                        }, function (XHR, textStatus) {
                            if (options.ajaxComplete !== undefined) {
                                options.ajaxComplete(XHR, textStatus);
                            }
                        });
                    });
                }
                else {
                    $page.show();
                    _self.ajaxPage(options.pageUrl, options.pageData, function (ajaxData) {
                        $page.html(ajaxData);
                        _self.$wrap.attr("cxpage", options.pageId)
                        options.callback();
                    }, function (XHR, textStatus) {
                        if (options.ajaxComplete !== undefined) {
                            options.ajaxComplete(XHR, textStatus);
                        }
                    });
                }
            }
        }
        else {//页面已存在内容是 只做切换
            if (_self.options.animate) {
                $page.addClass(options.animateClass).one('webkitAnimationEnd', function () {
                    options.callback();
                    $page.removeClass(options.animateClass);
                });
            }
            else {
                $page.show();
                options.callback();
            }
        }

        _self.pageList.push(options.pageId);
        _self.$wrap.find('.' + _self.options.activePageClass).removeClass(_self.options.activePageClass).hide();
        $page.addClass(_self.options.activePageClass);

        return this;
    },
    closePage: function (options) {//pageId remove animateClass
        var _self = this;
        var $page = $('#' + options.pageId);
        if ($page.length == 0) { alert("页面不存在！"); return false; }
        //更新页面列表
        //_self.pageList.pop();
        var index = _self.pageList.indexOf(options.pageId);
        _self.pageList.splice(index, 1);

        //更新页面activePageClass
        _self.$wrap.find('.' + _self.options.activePageClass).removeClass(_self.options.activePageClass);

        $('#' + _self.pageList[_self.pageList.length - 1]).addClass(_self.options.activePageClass);

        options.callback = typeof options.callback == "function" ? options.callback : function () { };


        if (_self.options.animate) {
            $page.addClass(options.animateClass).one('webkitAnimationEnd', function () {
                if (options.remove) {
                    $page.remove();
                }
                else {
                    $page.hide().removeClass(options.animateClass);
                }
                _self.$wrap.attr("cxpage", _self.pageList[_self.pageList.length - 1]);
                options.callback();
            });
        }
        else {
            if (options.remove) {
                $page.remove();
            }
            else {
                $page.hide();
            }
            _self.$wrap.attr("cxpage", _self.pageList[_self.pageList.length - 1]);
            options.callback();
        }

        return this;
    },
    changePage: function (page1, page2, synchro) {
        var self = this;
        if (!this.options.animate) {
            alert("非动画模式，不支持changePage");
            return false;
        }

        var $page1 = $('#' + page1.pageId);
        var $page2 = $('#' + page2.pageId);
        if ($page1.length == 0 && $page2.length != 0) {
            var $pagePrev = $page2.show(),pageNext=page1,pagePrev=page2,$pageNext=$('<div id="' + page1.pageId + '">').appendTo(this.$wrap);
        } else if ($page1.length != 0 && $page2.length == 0) {
            var   $pagePrev = $page1.show(), pageNext = page2, pagePrev = page1,$pageNext=$('<div id="' + page2.pageId + '">').appendTo(this.$wrap);
        } else if ($page1.length == 1 && $page2.length == 1) {
            var $pageNext = $page2.show(), $pagePrev = $page1.show(), pageNext = page2, pagePrev = page1;
            $pagePrev.addClass(page1.animateClass).one('webkitAnimationEnd', function () {
                $pagePrev.removeClass(page1.animateClass).hide();
            });
            $pageNext.addClass(page2.animateClass).one('webkitAnimationEnd', function () {
                $pageNext.removeClass(page2.animateClass);

                if (typeof pageNext.callback == "function") { pageNext.callback(); }
            });
            self.pageList.push(pageNext.pageId);
            $pagePrev.removeClass(self.options.activePageClass);
            $pageNext.addClass(self.options.activePageClass);
            return false;
        }
        
        pageNext.callback = typeof pageNext.callback == "function" ? pageNext.callback : function () { };
        $pageNext.css({ 'position': 'absolute', 'top': 0, 'left': 0, 'bottom': 0, 'right': 0, 'overflow': 'hidden', 'zIndex': this.index });
        if (pageNext.loaded || typeof pageNext.loaded == "undefined") {//加载后再跳转 
            this.ajaxPage(pageNext.pageUrl, pageNext.pageData, function (ajaxData) {
                if (synchro === undefined || synchro==true) {//同步
                    $pageNext.hide().append($(ajaxData));
                    $pagePrev.addClass(pagePrev.animateClass).one('webkitAnimationEnd', function () {
                        $pagePrev.hide().removeClass(pagePrev.animateClass);
                        $pageNext.show().addClass(pageNext.animateClass).one('webkitAnimationEnd', function () {
                            $pageNext.removeClass(pageNext.animateClass);
                            self.$wrap.attr('cxpage', pageNext.pageId);
                            pageNext.callback();
                        });
                    });
                }
                else {//非同步
                    $pageNext.append($(ajaxData));
                    $pagePrev.addClass(pagePrev.animateClass).one('webkitAnimationEnd', function () {
                        $pagePrev.hide().removeClass(pagePrev.animateClass);
                    });
                    $pageNext.addClass(pageNext.animateClass).one('webkitAnimationEnd', function () {
                        $pageNext.removeClass(pageNext.animateClass);
                        self.$wrap.attr('cxpage', pageNext.pageId);
                        pageNext.callback();
                    });
                }
            }, function (XHR, textStatus) {
                if (self.options.ajaxComplete !== undefined) {
                    self.options.ajaxComplete(XHR, textStatus);
                }
            });

        }
        else {//先跳转后加载
            $pageNext.css('backgroundColor', '#fff');
            if (typeof pageNext.preHtml != "undefined") {
                $pageNext.html(pageNext.preHtml);
            }

            if (synchro) {//同步
                $pagePrev.addClass(pagePrev.animateClass).one('webkitAnimationEnd', function () {
                    $pagePrev.hide().removeClass(pagePrev.animateClass);
                    $pageNext.addClass(pageNext.animateClass).one('webkitAnimationEnd', function () {
                        this.ajaxPage(pageNext.pageUrl, pageNext.pageData, function (ajaxData) {
                            $pageNext.removeClass(pageNext.animateClass);
                            self.$wrap.attr('cxpage', pageNext.pageId);
                            pageNext.callback();
                        }, function (XHR, textStatus) {
                            if (self.options.ajaxComplete !== undefined) {
                                self.options.ajaxComplete(XHR, textStatus);
                            }
                        });
                    });
                });
            }
            else {//非同步
                $pagePrev.addClass(pagePrev.animateClass).one('webkitAnimationEnd', function () {
                    $pagePrev.hide().removeClass(pagePrev.animateClass);
                });
                $pageNext.addClass(pageNext.animateClass).one('webkitAnimationEnd', function () {
                    this.ajaxPage(pageNext.pageUrl, pageNext.pageData, function (ajaxData) {
                        $pagePrev.hide().removeClass(pagePrev.animateClass);
                        self.$wrap.attr('cxpage', pageNext.pageId);
                        pageNext.callback();
                    }, function (XHR, textStatus) {
                        if (self.options.ajaxComplete !== undefined) {
                            self.options.ajaxComplete(XHR, textStatus);
                        }
                    });
                });
            }

        }

        self.pageList.push(pageNext.pageId);
        $pagePrev.removeClass(self.options.activePageClass);
        $pageNext.addClass(self.options.activePageClass);
        return this;
    },
    backPage: function (outAnimate, inAnimate, remove) {
        var self = this;
        var outId=ospage.pageList[ospage.pageList.length - 1];
        var inId = ospage.pageList[ospage.pageList.length - 2];
        this.pageList.pop();
        this.changePage({
            pageId: outId,
            animateClass: outAnimate
        }, {
            pageId: inId,
            animateClass: inAnimate
        });

        this.pageList.pop();
        
            $("#" + outId).one("webkitAnimationEnd", function () {
                self.$wrap.attr("cxpage", self.pageList[self.pageList.length - 1]);
                $('#' + outId).removeClass(self.options.activePageClass);
                $('#' + inId).addClass(self.options.activePageClass);
                if (remove) { $(this).remove(); }
            });
        
        
        
        
    },
    history: {

    },
    animationEnd: function (fun) {

    },
    setHistory: function () {

    },
    setLoadingText: function (text) {
        if (typeof text == "undefined") {
            this.loading.find('.loading-text').html('');
        }
        else {
            this.loading.find('.loading-text').html(text);
        }
        return this.loading;
    },
    getCurrentId: function () {
        return $('.' + this.options.activePageClass).attr('id');
    },
    testXHR: function (url,fun) {
        $.ajax({
            url: url+'?v='+Math.random(),
            timeout:1000,
            complete: function (XHR, textStatus) {
                if (textStatus == "success") {
                    return fun !== undefined ? fun(XHR, textStatus) : '';
                }
            },
            error: function (XHR, textStatus, errorThrown) {
                return fun !== undefined ? fun(XHR, textStatus) : '';
            }
        });
    }
}




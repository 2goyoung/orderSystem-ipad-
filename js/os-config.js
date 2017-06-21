/// <reference path="../library/backbone.js" />
/// <reference path="../library/underscore.js" />
/// <reference path="../library/zepto.js" />
/// <reference path="../extend/cxui-page.js" />
/// <reference path="../os-init.js" />
/// <reference path="os-Collection.js" />
/// <reference path="os-Model.js" />
/// <reference path="os-View.js" />

/*
    Description：点餐系统初始化和程序配置
    Author：zhangguoyong@revenco.com
    Created：2013/03/18
*/
var iscroll = iscroll === undefined ? {} : iscroll;//定义全局滚动条对象
var $body = $('body');
var $ajaxPage = $('#page');
var $page = $('.os-page');
var panel = {};//用于保存开台服务的相关数据
var $loading = $('.os-loading-bar');
var loadingTimer = {};
var sortData = { status: 'all', contain: 'all' };
var $preferences = { duration: 800, easing: 'easeInOutQuad', adjustHeight: false, useScaling: true };
var ospage = new cxuiPage($('#os-page'), { animate: true });

document.addEventListener('touchmove', function (e) { e.preventDefault(); }, false);//禁止滑动
$('select,input[text],input[radio],textarea').livequery('touchstart mousedown' /*'mousedown'*/, function (e) { e.stopPropagation(); });//防止iscroll引起不能点击的问题

//系统对象orderSystem
//定义Model、View、Collection
//配置系统所有页面跳转控制对象pages
//配置系统资源文件地址
window.orderSystem = {
    Model: {},
    View: {},
    Collection: {},
    datas: {//保存系统临时数据
        detialIndex: '',//保存被点击菜品的下标
        dinCatData: '',//保存菜品分类列表
        teaList:'',//保存系统茶品列表
        order: {//保存订单信息
            "id": "",//订单编号
            "dinNum":"",//餐桌容纳人数
            "perNum": 0,//就餐人数
            "dinCode": "",//台号标识
            "dinList": {},//已点菜品
            "teaList": {},//已点茶品
            "inOrder": {},//服务器订单
            "info": {} //订单信息
        },
        dinListLoaded: {},//保留已加载的菜品
        dinCatId: "",//记录用户点击的菜品分类的ID
        dinCatIndex: 0//记录用户点击菜品分类的下标
    },
    orderPanel:{},//开台面板对象
    loaded:false,//标识资源是否加载完成
    urlRouter: {//系统资源文件地址配置
        page: {
            "login": "./ajax-login.html",
            "channel": "./ajax-channel.html",
            "guide":'./ajax-guide.html',
            "menu":"./ajax-menu.html"
        },
        data: {
            "login": "./data/login.txt", //登录
            "logout": "./data/logout.txt",//注销
            "teaList": "./data/tea-list.txt",//茶品列表
            "areaCode": "./data/area-code.txt",//餐桌区域
            "tableList": "./data/table-list.txt",//餐桌列表
            "createOrder": "./data/create-order.txt",//创建订单
            "getOrder": "./data/order.txt",//服务器上订单
            "saveDish": "./data/save-dish.txt",//下单
            "cancelDish": "./data/cancel-dish.txt",//退单
            "dinCat": "./data/din-cat.txt",//菜品分类
            "dinList": "./data/din-list.txt",//"菜品列表"
            "orderId": "./data/order-id.txt",//订单ID
            "orderInfo": "./data/order-info.txt"//订单信息

            //"login": "/ipad/login.action",//登录
            //"logout": "/ipad/logout.action",//注销
            //"teaList": "/ipad/menu/all.action",//茶品列表
            //"areaCode":/ipad/channel/area.action,//餐桌区域
            //"tableList":/ipad/channel/list.action//餐桌列表
        },
        theme: {//预留，暂时没用
            "default": "./theme/default/css/os-default.css"
        }
    },
    pages: {
        login:function(){//配置登录页面
            ospage.openPage({
                pageId: 'os-login',
                pageUrl: orderSystem.urlRouter.page["login"],
                loadingText: '页面加载中...',
                pageTitle: '点餐系统-登录',
                animateClass: "pop in",
                loaded: true,
                callback: function () {
                    window.login = new orderSystem.View.login();
                }
            });
        },
        channel: function () {//配置选台页面
            ospage.openPage({
                pageId: "channel",
                pageUrl: orderSystem.urlRouter.page["channel"],
                pageTitle: "点餐系统-选台页",
                loadingText: '登录中...',
                animateClass: "pop in",
                loaded: true,
                ajaxCallback: function () {
                    //$('#os-login').hide();
                },
                callback: function () {
                    //初始化滚动条
                    iscroll.tableList = [];
                    $('.table-content').eq(0).addClass('active'); 

                    //var x;
                    //$('.table-content').on('touchstart', function (e) {
                    //    x = e.touches[0].pageX
                    //    //console.log(x)
                    //}).on('touchmove', function (e) {
                    //    console.log(x - e.touches[0].pageX)
                    //    $(this).css('-webkit-transform', 'translate3d(' + (e.touches[0].pageX-x)+ 'px, 0, 0)')
                    //})

                    $('.c-banner,.c-content').bind('tap', function () {
                        $('.opening').removeClass('opening');
                        $('.c-panel').removeClass('in');
                    })

                    //判断页面是否存在帐号注销的对象
                    if (orderSystem.logout === undefined) {
                        orderSystem.logout = new orderSystem.View.logout();
                    }

                    //餐厅区域
                    var areaCode = new orderSystem.View.areaCode();
                    
                    //生成茶品列表
                    orderSystem.getTeaList(function () {
                        orderSystem.teaList = new orderSystem.View.teaList({ 'collection': orderSystem.datas["teaList"] });
                        orderSystem.teaList.render();
                        iscroll.teasList = new iScroll('teas-list');
                    });

                    

                    //开台面板
                    orderSystem.orderPanel = new orderSystem.View.orderPanel();

                    

                }

            });
        },
        guide: function () {
            ospage.openPage({
                pageId: "guide",
                pageTitle: "",
                pageUrl: orderSystem.urlRouter.page["guide"],
                loadingText: "资源加载中...",
                animateClass: 'pop in',
                ajaxCallback: function () {
                    
                },
                callback: function () {
                    $('#guide .table-num').html(orderSystem.datas.order["dinCode"]);
                    $('#guide .person-num').html(orderSystem.datas.order["perNum"]);
                    var goArticle = function (title,url) {
                        orderSystem.pages.article(title, url)
                    }
                    //跳转其他页面
                    $('.guide-list a').on('touchstart mousedown', function () {
                        $(this).find('i').addClass('magnify');
                        $(this).attr({ 'up': 'false', 'animated': 'false' });
                        return false;
                    });
                    $('.guide-list a').on('touchend mouseup', function () {
                        if ($(this).attr('animated') == "true") {
                            if ($(this).hasClass('menu')) {
                                orderSystem.pages.menu();
                            } else {
                                var title = $(this).text();
                                var ul = $(this).attr('href');
                                orderSystem.pages.article(title, ul);
                            }
                        }
                        else {
                            $(this).attr({ 'up': 'true' });
                        }
                        return false;
                    });
                    $('.guide-list a').on('click', function () { return false; });
                    $('.guide-list a').on('webkitAnimationEnd', function () {
                        $(this).attr({ 'animated': 'true' }).find('i').removeClass('magnify');
                        if ($(this).attr('up') == "true") {
                            if ($(this).hasClass('menu')) {
                                orderSystem.pages.menu();
                            } else {
                                var title = $(this).text();
                                var ul = $(this).attr('href');
                                orderSystem.pages.article(title, ul);
                            }
                        }
                    })
                }
            });
        },
        article:function(title,url){
            ospage.changePage({
                pageId: "guide",
                animateClass: "turn out "
            }, {
                pageId: "article",
                pageTitle: title,
                pageUrl: url,
                loadingText: '加载内容中...',
                animateClass: "fade in",
                loaded: true,
                callback: function () {
                    iscroll.article = new iScroll($('.article-main')[0]);
                }
            }, false);
        },
        menu: function (pageCallback) {
            var outId = ospage.getCurrentId();
            ospage.changePage({
                pageId: outId,
                animateClass: "turn out "
            }, {
                pageId: "menu",
                pageTitle: "菜谱",
                pageUrl: orderSystem.urlRouter.page["menu"],
                loadingText: '加载菜谱中...',
                animateClass: "fade in",
                loaded: true,
                ajaxCallback:function(){

                },
                callback: function () {
                    

                        if (pageCallback !== undefined) {
                            pageCallback();
                        }
                        //alert(orderSystem.datas.order["inOrder"].length)
                        //更新计费数据
                        var totalData = orderSystem.datas.order["dinList"].calculate();
                        var totalPrice = parsePrice(totalData.totalPrice);
                        $('#din-count').html(totalData.totalNum);
                        $('#din-price').html(totalPrice);

                        //更新订单信息

                        orderSystem.getOrderInfo(function () {
                            orderSystem.datas.order["dinCode"] = orderSystem.datas.order["info"].ordInfo.dinCodes;
                            $('#menu .table-num').html(orderSystem.datas.order["dinCode"]);
                            if (orderSystem.datas.order["perNum"] == "0") { orderSystem.datas.order["perNum"] = orderSystem.datas.order["info"].ordInfo.cusNum; }
                            $('#menu .person-num').html(orderSystem.datas.order["perNum"]);
                            $('#menu .order-time').html(orderSystem.datas.order["info"].ordInfo.ordStartTime);
                        });




                        var hasTouch = 'ontouchstart' in window;

                        orderSystem.datas.haSwipe = false;
                        //菜谱页
                        iscroll.menu = [];

                        iscroll.menu[1] = new iScroll($('.food-list-wrap')[0]);
                        //iscroll.menu[2] = new iScroll($('.sub-classify')[0], { hScroll: true, vScroll: false, hScrollbar: false, vScrollbar: false });

                        //生成菜品分类列表
                        if ($('.menu-nav-list li').length == 0) {
                            if (orderSystem.datas.dinCat) {
                                var dinCat = new orderSystem.View.dinCat({ 'collection': orderSystem.datas["dinCat"] });
                                dinCat.render();
                                $('#' + orderSystem.datas.dinCatId).trigger('tap');
                                orderSystem.datas.dinCatId = "";
                                iscroll.menu[0] = new iScroll($('.os-menu-nav .wrap')[0]);
                            } else {
                                orderSystem.getDinCat(function () {
                                    var dinCat = new orderSystem.View.dinCat({ 'collection': orderSystem.datas["dinCat"] });
                                    dinCat.render();
                                    $('#' + orderSystem.datas.dinCatId).trigger('tap');
                                    orderSystem.datas.dinCatId = "";
                                    iscroll.menu[0] = new iScroll($('.os-menu-nav .wrap')[0]);
                                });
                            }
                        } else {
                            $('#' + orderSystem.datas.dinCatId).trigger('tap');
                            orderSystem.datas.dinCatId = "";
                        }





                        $('.din-item-detail .btn-close').livequery('tap', function () {
                            $('.din-item-detail').removeClass("pop in ").addClass("pop out").one("webkitAnimationEnd", function () {
                                $(this).find('.wrap').html("").removeAttr("style");
                            });
                        });

                        var startX = 0, infoHeight, infoWidth;
                        if (hasTouch) {
                            $('.din-item-detail .wrap').on('touchstart', function (e) {
                                orderSystem.datas.haSwipe = false;
                                startX = e.touches[0].pageX;
                                $(this).css('-webkit-transform', 'translate3d(' + 0 + 'px, 0, 0)');
                                infoHeight = $(".din-item-detail .item-detail").eq(0).height();
                                infoWidth = $(".din-item-detail .item-detail").eq(0).width();
                            }).on('touchmove', function (e) {
                                var delta = e.touches[0].pageX - startX;
                                $(this).css('-webkit-transform', 'translate3d(' + delta + 'px, 0, 0)');
                                var h = parseInt(Math.abs(delta) / infoWidth * infoHeight);
                                //$(this).find(".item-detail").eq(0).css('-webkit-transform', 'translate3d(0,' + h + 'px, 0)');
                            }).on('touchend', function () {
                                //setTimeout(function(){alert(orderSystem.datas.haSwipe)},300)
                                setTimeout(function () {
                                    if (!orderSystem.datas.haSwipe) {
                                        $('.din-item-detail .wrap').addClass("animate").css('-webkit-transform', 'translate3d(0, 0, 0)');
                                    }
                                }, 100)
                            });
                        } else {
                            $('.din-item-detail .wrap').on('mousedown', function (e) {
                                startX = e.pageX;
                                orderSystem.datas.haSwipe = false;
                                infoHeight = $(".din-item-detail .item-detail").eq(0).height();
                                infoWidth = $(".din-item-detail .item-detail").eq(0).width();
                                console.log(infoHeight, infoWidth)

                                $(this).on('mousemove', function (e) {
                                    var delta = e.pageX - startX;
                                    $(this).css('-webkit-transform', 'translate3d(' + delta + 'px, 0, 0)');
                                    var h = parseInt(Math.abs(delta) / infoWidth * infoHeight);
                                    $(this).find(".item-detail").eq(0).css('-webkit-transform', 'translate3d(0,' + h + 'px, 0)');
                                });
                            }).on('mouseup', function () {
                                $(this).off("mousemove");
                                setTimeout(function () {
                                    if (!orderSystem.datas.haSwipe) {
                                        $('.din-item-detail .wrap').addClass("animate").css('-webkit-transform', 'translate3d(0, 0, 0)');
                                    }
                                }, 300)

                            });
                        }
                        $('.din-item-detail .wrap').on('webkitTransitionEnd', function () {
                            $(this).removeClass('animate').css({ '-webkit-transform': 'translate3d(0, 0, 0)' })
                        });
                        $('.din-item-detail .item-detail').livequery('webkitTransitionEnd', function () {
                            $(this).removeClass('animate')
                        })

                    }
                
            }, false);
        },
        order: function (pageCallback) {
            var outId = ospage.getCurrentId();
            ospage.changePage({
                pageId:outId ,
                animateClass: "flip out reverse"
            }, {
                pageId: "order",
                pageTitle: "订单",
                loadingText: '加载订单中...',
                pageUrl: "ajax-order.html",
                animateClass: "flip in reverse",
                loaded: true,
                callback: function () {
                    if (pageCallback !== undefined) {
                        pageCallback();
                    }
                    //订单页
                    //更新订单信息
                    $('#order .table-num').html(orderSystem.datas.order["dinCode"]);
                    orderSystem.getOrderInfo(function () {
                        if (orderSystem.datas.order["perNum"] == "0") { orderSystem.datas.order["perNum"] = orderSystem.datas.order["info"].ordInfo.cusNum; }
                        $('#order .person-num').html(orderSystem.datas.order["perNum"]);
                        $('#order .order-time').html(orderSystem.datas.order["info"].ordInfo.ordStartTime);
                    });
                    
                    $('.call-service').on('tap', function (e) {
                        e.stopPropagation();
                        orderSystem.alert("暂不支持此功能");
                    })

                    iscroll.orderList = [];
                    var orderSlider = {
                        init: function ($silder, index) {

                            var self = this;

                            this.$silder = $silder;
                            this.getHeight();

                            this.showList(index);

                            $.each(this.$silder.find('.order-list-wrap'), function (i, n) {
                                iscroll.orderList[i] = new iScroll(n);
                            });

                            $silder.on('tap', 'dt', function () {

                                if ($(this).parent().hasClass('active')) { return false; }
                                var index = $(this).parent().index();
                                self.showList(index);
                            });
                            $(window).resize(function () {
                                self.getHeight();
                                var index = self.$silder.find('.active').index();
                                self.setTitlePosition(index);
                            });
                        },
                        showList: function (index) {

                            this.$silder.find('.t').removeClass('t');
                            this.$silder.find('dd').css('opacity', 0);
                            this.$silder.find('li').removeAttr('style');
                            this.$silder.find('.active').removeClass('active');

                            this.setTitlePosition(index);
                            this.$silder.find('dl').eq(index).addClass('active').find('dd').animate({ 'opacity': '1' }, {
                                complete: function () {

                                    var $li = $(this).find('li');
                                    $.each($li, function (i, n) {
                                        var delay = 0.1 * i;
                                        $(this).attr('style', '-webkit-transition-delay:' + delay + 's;opacity:1;').addClass('t');
                                    });
                                }
                            });
                        },
                        setTitlePosition: function (index) {
                            var dlList = this.$silder.find('dl');
                            var self = this;
                            $.each(dlList, function (i, n) {
                                if (i <= index) {
                                    $(this).css({ '-webkit-transform': 'translate(0,0)' });
                                } else {
                                    $(this).css({ '-webkit-transform': 'translate(0,' + self.contentHeight + 'px)' });
                                }
                            });
                        },
                        getHeight: function () {
                            this.height = this.$silder.height();
                            this.num = this.$silder.find('dl').length;
                            this.titleHeight = this.$silder.find('dt').height();
                            this.contentHeight = this.height - this.titleHeight * this.num;
                            this.sliderHeight = this.contentHeight - this.titleHeight;
                            this.$silder.find('dd').height(this.contentHeight)
                        }
                    }


                    //获取订单
                    var orderCatList = {};
                    if (outId == "menu") {
                        if ($(".os-order-content dl").length <= 1) {
                            
                            orderCatList = new orderSystem.View.orderCatList({ collection: orderSystem.datas["dinCat"] });
                            orderCatList.render();
                        }
                        orderSlider.init($('.os-order-content'), 0);
                        
                    } else {
                        orderSystem.mergeOrder(function () {
                            orderSystem.getDinCat(function () {
                                orderCatList = new orderSystem.View.orderCatList({ collection: orderSystem.datas["dinCat"] });
                                orderCatList.render();
                                orderSlider.init($('.os-order-content'), 0);
                            })
                        });
                    }
                    
                    //生成分类
                    

                    //

                    new orderSystem.View.orderSubmit();

                    }
                
            }, true);
        },
        back: function () {
            ospage.backPage("slide out reverse","slide in reverse",true);

        }
    },
    initialize: function () {
        var _self = this;
        if (_self.loaded) {
            _self.pages.login();
            _self.datas.dinListLoaded = new orderSystem.Collection.dinListLoaded();
            _self.datas.order["teaList"] = new orderSystem.Collection.teaOrder();
            _self.datas.order["dinList"] = new orderSystem.Collection.dinOrder();
        }else{
            window.onload = function () {
                _self.pages.login();
                _self.datas.dinListLoaded = new orderSystem.Collection.dinListLoaded();
                _self.datas.order["teaList"] = new orderSystem.Collection.teaOrder();
                _self.datas.order["dinList"] = new orderSystem.Collection.dinOrder();
            };
        }
        $('.top-order-info').livequery('tap',function () {
            orderSystem.pages.order();
        });
       
    },
    getTeaList: function (callback) {
        this.datas["teaList"] = new orderSystem.Collection.teaList();
        this.datas["teaList"].deferred.done(function () {
            if (callback !== undefined) {
                callback();
            }
        });
    },
    getDinCat: function (callback) {
        this.datas["dinCat"]= new orderSystem.Collection.dinCatList();
        this.datas["dinCat"].deferred.done(function () {
            if (callback !== undefined) {
                callback();
            }
        });
    },
    getOrderId: function (callback) {
        //设置orderSystem.datas.order["id"] 
        $.getJSON(this.urlRouter.data["orderId"], { _seq_dinCode: this.datas.order["dinCode"] }, function (data, status, xhr) {
            if (data.state == 0) {
                orderSystem.alert(data.message);
                return false;
            } else {
                orderSystem.datas.order["id"] = data.ordId;
                if (callback !== undefined) {
                    callback();
                }
                return data.ordId;
            }
            
        })
    },
    getOrderData: function (callback) {
        //设置orderSystem.datas.order["inOrder"] 
        //先判断是否存在订单ID

        var _self = this;
        if (this.datas.order["id"]=="") {
            this.getOrderId(function () {
                _self.datas.order["inOrder"] = new orderSystem.Collection.order();
                _self.datas.order["inOrder"].deferred.done(function () {
                    if (callback !== undefined) {
                        callback();
                    }
                });
            });
        } else {
            _self.datas.order["inOrder"] = new orderSystem.Collection.order();
            _self.datas.order["inOrder"].deferred.done(function () {
                if (callback !== undefined) {
                    callback();
                }
            });
        }
    },
    getOrderInfo: function (callback) {
        //设置orderSystem.datas.order["info"] 
        var _self = this;
        if (!_self.datas.order["info"].length) {
            var collectionDate = new orderSystem.Collection.orderInfo();
            
            collectionDate.deferred.done(function () {
                _self.datas.order["info"] = collectionDate.models[0].attributes;
                if (callback !== undefined) {
                    callback();
                }
            });
        }else{
            if (callback !== undefined) {
                callback();
            }
        }
    },
    mergeOrder: function (callback) {
        //将order["inOrder"]数据整合到order["dinList"]
        var _self = this;
        if (_self.datas.order["inOrder"].length) {
            _.each(_self.datas.order["inOrder"].models[0].attributes.ordDishInfo, function (element) {
                var list = _self.datas.order["dinList"].findWhere({ "dishId": element.dishId });
                if (typeof list == "undefined") {

                    if (element.typeName == "茶位") {
                        _self.datas.order["teaList"].add(new orderSystem.Model.empty(element));
                    } else {
                        //增加菜品对象
                        element.ordNum = 0;
                        _self.datas.order["dinList"].add(new orderSystem.Model.empty(element));
                    }
                } else {
                    //修改订单菜品对象
                    list.set({ "total": parseInt(list.attributes.total) + parseInt(element.total) })
                }
            });
            if (callback !== undefined) {
                callback();
            }
        } else {//0 或 _self.datas.order["inOrder"]不存在
            this.getOrderData(function () {
                _.each(_self.datas.order["inOrder"].models[0].attributes.ordDishInfo, function (element) {
                    var list = _self.datas.order["dinList"].findWhere({ "dishId": element.dishId });
                    if (typeof list == "undefined") {

                        if (element.typeName == "茶位") {
                            _self.datas.order["teaList"].add(new orderSystem.Model.empty(element));
                        } else {
                            //增加菜品对象
                            element.ordNum = 0;
                            _self.datas.order["dinList"].add(new orderSystem.Model.empty(element));
                        }
                    } else {
                        //修改订单菜品对象
                        list.set({ "total": parseInt(list.attributes.total) + parseInt(element.total) })
                    }
                });
                if (callback !== undefined) {
                    callback();
                }
            });
        }
    },
    
}
window.onload=function () {
    orderSystem.loaded = true;
    setTimeout(scrollTo, 0, 0, 0);
};
//系统网络状态，分支[”离线“,”服务器不能访问“,"正常访问"]各状态
if (!navigator.onLine) {
    //离线状态
    var showHtml = '<div class="os-top"><img class="logo" src="theme/default/images/logo.png"/></div>' +
                                '<div class="os-login">' +
                                    '<form id="login">' +
                                        '<div class="login">' +
                                            '<div class="t"></div>' +
                                            '<div class="m">' +
                                                '<div class="u-name"><label>用户名</label><input id="u-name" type="text" /></div>' +
                                                '<div class="u-pw"><label>密码</label><input id="u-pw" type="password"/></div>' +
                                            '</div>' +
                                            '<div class="b">' +
                                                '<input type="reset" value="重置"/>' +
                                                '<input type="submit" value="确定"/>' +
                                            '</div>' +
                                        '</div>' +
                                    '</form>' +
                                '</div>';
    $('#os-page').append($(showHtml));
    orderSystem.alert("你当前处于离线状态，系统不可用");
} else {
    //非离线状态

    //判断资源是否需要更新
    if (window.applicationCache.status == window.applicationCache.UPDATEREADY) {

    }

    ospage.setLoadingText("系统初始化中...").show();

    //判断请求地址可访问
    ospage.testXHR("./images/test.png", function (xhr, text) {
        
        if (xhr.status == "200") {
            //系统开始
            window.orderSystem.initialize();
        }
        else {
            ospage.loading.hide();
            orderSystem.alert("网络请求异常,请刷新系统重试", {
                "btnText":"刷新",
                "callback": function () {
                    window.location.reload();
                }
            })
            
        }

    });
}
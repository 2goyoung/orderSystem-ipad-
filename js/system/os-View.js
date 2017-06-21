/// <reference path="../library/backbone.js" />
/// <reference path="../library/underscore.js" />
/// <reference path="../library/zepto.js" />
/// <reference path="../extend/cxui-page.js" />
/// <reference path="../os-config.js" />
/// <reference path="os-Collection.js" />
/// <reference path="os-Model.js" />
/// <reference path="os-View.js" />


/*os-View层
    Description：依赖zepto.js，负责一切和界面相关的工作，比如绑定html模板，绑定界面元素的事件，初始的渲染，模型值改变后的重新渲染和界面元素的销毁等
    Author：zhangguoyong@revenco.com
    Created：2013/03/18
*/

//登录模块
orderSystem.View.login = Backbone.View.extend({
    el: '#login',
    events: {
        "submit": "login"
    },
    initialize: function () {
        _.bindAll(this, 'login', 'verify');
        this.model = new orderSystem.Model.login();
    },
    login: function (e) {
        $('input:focus').blur();
        e.preventDefault();
        var usercode = $.trim($('#u-code').val());
        var password = hex_md5($.trim($('#u-pw').val()));
        this.model.save({ "usercode": usercode, "password": password }, { success: this.verify, error: this.fetchError });
    },
    verify: function (model, response) {
        model.clear();
        if (response.state == "1") {
            this.loginSuccess();
        } else {
            this.loginFail(response.message);
        }
    },
    loginSuccess: function () {
        //登录成功
        $('#u-pw').val('');
        orderSystem.pages.channel();
    },
    loginFail: function (message) {
        ospage.loading.hide();
        if (message !== undefined) {
            orderSystem.alert("登录失败 " + message)
        }
    },
    fetchError: function (model, response) {
        orderSystem.alert("登录请求出错，请重试或刷新页面")
    }
})

//注销模块
orderSystem.View.logout = Backbone.View.extend({
    el: 'body',
    events: {
        'tap .btn-logout': 'logout'
    },
    initialize: function () {
        _.bindAll(this, 'verify', 'logout', 'logoutSuccess', 'logoutFail');
        this.Model = new orderSystem.Model.logout();
    },
    logout: function () {
        ospage.setLoadingText("帐号注销中...").show();
        this.Model.fetch({ success: this.verify });
        return false;
    },
    verify: function (model, response) {
        model.clear();
        if (response.state == "1") {
            this.logoutSuccess();
        } else {
            this.logoutFail(response.message);
        }
    },
    logoutSuccess: function () {
        //注销成功
        ospage.loading.hide();
        var currentPageId = ospage.getCurrentId();
        $('#os-login').show();
        ospage.closePage({
            pageId: currentPageId,
            animateClass: 'pop out reverse',
            remove: true
        });
    },
    logoutFail: function (message) {
        ospage.loading.hide();
        orderSystem.alert(message);
    }
})



//茶品列表
orderSystem.View.teaListItem = Backbone.View.extend({
    tagName: 'li',
    initialize: function () {
        _.bindAll(this, 'teaAdd', 'teaMinus', 'selectNum', 'updataUI');
        this.model.on('change', this.updataUI)
        return this;
    },
    events: {
        'tap .add': 'teaAdd',
        'tap .minus': 'teaMinus',
        'change select': 'selectNum'
    },
    teaAdd: function () {
        //console.log(this.model.attributes);
        //var price = $(this).parents('li').find('.price').attr('p');
        //var $current = $($(this).siblings('select').find('option').eq($(this).siblings('select')[0].selectedIndex));

        var price = this.model.attributes.salePrices[0].price;
        var ordNum = this.model.attributes.ordNum === undefined ? 1 : this.model.attributes.ordNum + 1;
        if (ordNum > this.$el.find('select option').length - 1) {
            var $select = this.$el.find('select');
            $select.find('option').last().clone().appendTo($select).html(ordNum)
        }
        this.model.set({ "ordNum": ordNum })

        //if ($current.text() == panel.max) { return false; }
        //$current.next()[0].selected = true;
        //$panel.calculate(1, price);
    },
    teaMinus: function () {
        var price = this.model.attributes.salePrices[0].price;
        if (this.model.attributes.ordNum === undefined || this.model.attributes.ordNum == 0) { return false; }
        var ordNum = this.model.attributes.ordNum - 1;
        this.model.set({ "ordNum": ordNum });
    },
    selectNum: function () {
        var ordNum = parseInt(this.$el.find('select').val());
        this.model.set({ "ordNum": ordNum });
    },
    updataUI: function () {
        this.$el.find('select option').eq(this.model.attributes.ordNum)[0].selected = true;

        $('.c-panel .bg-layer').addClass('flash');
        var totalData = orderSystem.datas.order["teaList"].calculate();
        var totalPrice = parsePrice(totalData.totalPrice);

        $('.c-panel .teas i').html('<span class="c">' + totalData.totalNum + '</span>/<span class="max">' + orderSystem.datas.order["dinNum"] + '</span>');
        $('.c-panel .count i').html(totalPrice);

        orderSystem.datas.order["perNum"] = totalData.totalNum;
    }
})

orderSystem.View.teaList = Backbone.View.extend({
    el: ".teas-list",
    initialize: function () {
        var self = this;
        _.bindAll(this, 'render', 'renderItem');
        this.template = _.template($('#template-tea-list').html());
    },
    render: function () {
        for (var i = 0; i < this.collection.models.length; i++) {
            this.renderItem(this.collection.models[i]);
        };
        return this;
    },
    renderItem: function (model) {
        var itemView = new orderSystem.View.teaListItem({ 'model': model });
        this.$el.append(itemView.$el.wrapInner(this.template(itemView.model.toJSON())));
    }
})


//开台服务面板
orderSystem.View.orderPanel = Backbone.View.extend({
    el: '.c-panel',
    events: {
        'tap .btn-ok': 'createOrder',
        'tap .btn-cancel': 'closePanel'
    },
    initialize: function () {
        _.bindAll(this, 'reset', 'submitOrder', 'createOrder', 'switchState', 'orderSuccess', 'submitSuccess');
        this.$panel = $(this.el);
        this.$teas = this.$panel.find('.teas i');
        this.$count = this.$panel.find('.count i');
        this.$tNum = this.$panel.find('.table-num');
    },
    reset: function (num, max, callback) {

        orderSystem.datas.order["teaList"].reset()
        orderSystem.teaList.collection.each(function (model) {
            model.set({ "ordNum": 0 }, { silent: true })
        })

        this.$tNum.html(num);
        this.$count.html('0.00');
        this.$teas.html('<span class="c">0</span>/<span class="max">' + max + '</span>');

        //reset select
        var options = '';
        for (i = 0; i <= max; i++) {
            options += '<option>' + i + '</option>';
        }
        this.$el.find('select').each(function () {
            $(this).html(options);
        });
        if (callback !== undefined) {
            callback();
        }
    },
    showPanel: function () {
        $('.c-panel').addClass('in');
    },
    closePanel: function () {
        $('.opening').removeClass('opening');
        $('.c-panel').removeClass('in');
    },
    createOrder: function () {
        ospage.setLoadingText("正在创建订单...").show();
        //请求创建订单
        var createOrder = new orderSystem.Model.createOrder();
        createOrder.fetch({ data: { 'dinCode': orderSystem.datas.order['dinCode'] }, success: this.switchState, error: this.fetchError });
    },
    submitOrder: function () {
        var num=orderSystem.datas.order["teaList"].calculate().totalNum;
        this.model = new orderSystem.Model.orderTeaList({ "ordId": orderSystem.datas.order['id'], "cusNum": num, "dishInfo": orderSystem.datas.order["teaList"].toJsonList() });
        this.model.save(null, { success: this.submitSuccess, error: this.fetchError })
    },
    switchState: function (model, response) {
        switch (response.state) {
            case "0": {
                if (orderSystem.datas.order['id'] === undefined || orderSystem.datas.order['id']=="") {
                    this.createError(response.message);
                } else {
                    this.submitOrder();
                }
                break;
            }
            case "1": {
                orderSystem.datas.order['id'] = response.ordId;
                this.submitOrder();
            }
        }
    },
    createError: function (message) {
        ospage.loading.hide();
        setTimeout(function () { orderSystem.alert(message); }, 200);
    },
    submitSuccess: function (model, response) {
        if (response.state == "1") {
            this.orderSuccess();
        } else {
            this.orderError();
        }
    },
    orderSuccess: function () {
        orderSystem.datas.order["teaList"].each(function (model) {
            var ordNum = model.attributes.ordNum;
            model.set({ "state": "2", "total": ordNum })
        })
        orderSystem.pages.guide();
    },
    orderError: function () {
        ospage.loading.hide();
        setTimeout(function () { orderSystem.alert("茶品下单出错，请重试"); }, 400);
    },
    fetchError: function () {
        ospage.loading.hide();
        setTimeout(function () { orderSystem.alert("请求出错，请重试"); }, 400);
    }
})

//餐桌区域
orderSystem.View.areaCode = Backbone.View.extend({
    el: '.select-area',
    events: {
        "tap li": "changeArea"
    },
    initialize: function () {
        _.bindAll(this, 'render', 'fetchError');
        this.template = _.template($('#template-area-code').html());
        this.collection = new orderSystem.Collection.areaCode();
        this.collection.fetch({ success: this.render, error: this.fetchError })
        $('.table-content').livequery('webkitAnimationEnd', function () {
            $(this).removeClass('in out flow reverse');
        });
    },
    render: function (collection, response) {
        var self = this;
        var datas = { "datas": response };
        this.$el.html(this.template(datas));
        setTimeout(function () {
            $.each(self.$el.find('li'), function (i, n) {
                var delay = 0.1 * i;
                $(this).attr('style', '-webkit-transition-delay:' + delay + 's;').addClass('t');
            });
        }, 100);

        //初始化餐桌列表
        this.tableList = new orderSystem.View.tableList({ 'areaCode': response });

    },
    fetchError: function (collection, response) {
        orderSystem.alert("餐桌区域获取失败");
    },
    changeArea: function (e) {
        var _this = this;
        var $self = $(e.target);
        if ($self.hasClass('active')) { return false; }
        var areacode = $self.attr('areacode');
        var oldAreacode = $('.select-area .active').attr('areacode');
        var index = $self.index();
        var oldIndex = $('.select-area .active').index();
        var arrow = index - oldIndex//切换的方向
        $('.select-area .active').removeClass('active');
        $self.addClass('active');
        if (arrow > 0) {
            $('.table-content[area-code="' + oldAreacode + '"]').addClass('flow out').one('webkitAnimationEnd', function () {
                var $current = $('.table-content[area-code="' + areacode + '"]');
                $current.addClass('active flow in').one('webkitAnimationEnd', function () {
                    if ($current.attr('has-data') != 'true') {
                        _this.tableList.gettableList(areacode);
                    }
                });
                $(this).removeClass('active');

            });
        }
        else {
            $('.table-content[area-code="' + oldAreacode + '"]').addClass('flow out reverse').one('webkitAnimationEnd', function () {
                var $current = $('.table-content[area-code="' + areacode + '"]');
                $current.addClass('active flow in reverse').one('webkitAnimationEnd', function () {
                    if ($current.attr('has-data') != 'true') {
                        _this.tableList.gettableList(areacode);
                    }
                });
                $(this).removeClass('active');
            });
        }
        e.preventDefault();
    }
})

//餐桌列表
orderSystem.View.tableList = Backbone.View.extend({
    el: '.table-content-wrap',
    count: 0,
    initialize: function () {
        var _self = this;
        _.bindAll(this, 'render', 'fetchError', 'gettableList', 'timming', 'updata');

        //读取模版
        this.templateListWrap = _.template($('#template-list-wrap').html());
        this.templateList = _.template($('#template-table-list').html());

        //优先生成餐桌列表外层容器
        $('.table-content-wrap').html(this.templateListWrap({ code: this.options.areaCode }));

        //请求餐桌数据
        this.collection = new orderSystem.Collection.tableList();
        var showCode = this.options.areaCode[0].areaCode;
        var $content = $('.table-content[area-code="' + showCode + '"]').addClass('active');
        this.gettableList(showCode);

        //处理提示效果动画回调
        $('.c-panel .bg-layer').livequery('webkitAnimationEnd', function () {
            $(this).removeClass('flash');
        });

        //注册点击餐桌事件
        $(this.el).on('tap', '.t-reserve,.t-free', function (e) {
            e.stopPropagation();
            orderSystem.datas.order['dinList'] =new orderSystem.Collection.dinOrder();
            var $self = $(this);
            if ($self.hasClass('opening')) { return false; }

            $('.opening').removeClass('opening');
            $self.addClass('opening');

            //保存餐桌信息
            orderSystem.datas.order['dinCode'] = $self.parent().attr('din-code');
            orderSystem.datas.order['dinNum'] = $self.parent().attr('din-num');

            //重设开台面板
            orderSystem.orderPanel.reset(orderSystem.datas.order['dinCode'], orderSystem.datas.order['dinNum'], orderSystem.orderPanel.showPanel)


        });
        //点击就餐中的餐桌 跳转到订单页
        $(this.el).on('tap', '.t-repast', function (e) {
            //清空订单
            orderSystem.datas.order['dinList'] =new orderSystem.Collection.dinOrder();
            var tNum = $(this).next().text();
            orderSystem.datas.order['dinCode'] = $(this).parent().attr('din-code');
            orderSystem.confirm("餐桌(" + tNum + ")已开台，是否查看该餐桌的订单？", {
                "btnOKText": "查看", "okCallback": function () {
                    orderSystem.pages.order();
                }
            })
        });
    },
    gettableList: function (areaCode) {
        this.areaCode = areaCode;
        this.collection.fetch({ data: { '_leq_areaCode': areaCode }, success: this.render, error: this.fetchError });
    },
    render: function (collection, response) {

        //渲染餐桌列表
        var datas = { "tableList": response };
        var $content = $('.table-content[area-code="' + this.areaCode + '"]');
        $content.html(this.templateList(datas));

        //更新餐桌时间
        this.timming();

        //设置餐桌状态，及出场效果
        $content.find('li[din-code]').addClass('hide-out out').hide();
        iscroll.tableList[this.count] = new iScroll($content[0]);
        tableFilter.sort(sortData.status, sortData.contain);
        $content.attr('has-data', 'true');

        this.count++;
        return this;
    },
    timming: function () {
        this.timer = {};
        var nowDate = new Date();
        var timeReg = /\d{1,2}/g;
        var hour = nowDate.getHours();
        var minute = nowDate.getMinutes();
        $('.t-repast .time').each(function (i, n) {
            var timeStr = $(this).attr('start-time');
            var match = timeStr.match(timeReg);
            var differHour = parseInt(hour - match[0]);
            var differMinute = minute - match[1];
            $(this).html('<span>' + differHour + ':' + (differMinute > 9 ? differMinute : ('0' + differMinute)) + '</span>');
        });
        this.timer = setTimeout(this.timming, 30000);
    },
    updata: function () {

    },
    fetchError: function (collection, response) {
        orderSystem.alert("error");
    }
})

//菜品分类列表
orderSystem.View.dinCatItem = Backbone.View.extend({
    tagName: "li",
    events: {
        "tap": "changeCat"
    },
    initialize: function () {
        _.bindAll(this, "render", "changeCat", "renderDinList", "getDinList", "renderDinListItem")
        //this.template = _.template($('#template-din-list').html());
        this.$dinListPanel = $($('#template-din-list-wrap').html()).appendTo($('.food-content'));
        //this.$dinListPanel = $('<div class="food-list-wrap">').appendTo($('.food-content'));
        this.$el.attr("id","t_" +this.model.attributes.id)

    },
    render: function (model, reponse) {
        var dinCatData = { "dinCat": reponse };
        console.log(this.template(dinCatData));
    },
    changeCat: function () {
        if (this.$el.hasClass('active')) { return false; }

        var _self = this;

        //响应交互效果
        this.$el.siblings('.active').removeClass('active');
        this.$el.addClass('active');
        $('.food-active').removeClass("din-in").addClass('din-out').one('webkitAnimationEnd', function () {
            $(this).removeClass('food-active din-out');
        });
        this.$dinListPanel.removeClass("din-out").addClass('food-active din-in').one('webkitAnimationEnd', function () {
            $(this).removeClass('din-in');
            if ($(this).attr('has-data') == 'true') {
                return false;
            }
            else {
                //获取菜品列表并渲染
                _self.getDinList();
            }
        });

    },
    getDinList: function () {
        var dinListCollection = new orderSystem.Collection.dinList();
        dinListCollection.fetch({ data: { _seq_typeId: this.model.id }, success: this.renderDinList })
    },
    renderDinList: function (collection, reponse) {
        //set Collection
        
        var id=this.model.id;
        collection.each(function (model) {
            orderSystem.datas.dinListLoaded.add(model);
            //test start
            model.set({ "typeId": id },{ silent: true })
            //test end
        });
        

        //整合订单数据
        if (orderSystem.datas.order["dinList"].length != 0) {

            var dinInOrder = orderSystem.datas.order["dinList"].where({ "typeId": this.model.id });

            if (dinInOrder.length) {
                //如果列表中的菜品已存在订单中
                _.each(dinInOrder, function (element, index) {

                    if (element.attributes.state != 0) {
                        //更新菜品数据
                        var dinModel = collection.findWhere({ "dishId": element.attributes.dishId });
                        

                        if (element.attributes.state == 1) {
                            dinModel.set({ "ordNum": parseInt(dinModel.attributes.ordNum, 10) + parseInt(element.attributes.ordNum, 10) })
                            if (typeof element.attributes.temporary != "undefined") {
                                //重新指定订单中未下单的model

                                console.log(dinInOrder)
                                //dinInOrder[index] = dinModel;
                            }
                        } else {
                            dinModel.set({ "total": parseInt(dinModel.attributes.total, 10) + parseInt(element.attributes.total, 10) });
                        }
                        
                    }
                })
                console.log(collection)
            }

        }

        this.listHtml = $('<ul class="food-list hide">');
        for (var i = 0; i < collection.models.length; i++) {
            this.renderDinListItem(collection.models[i]);
        }
        var $fixHtml = this.$dinListPanel.find('.food-list .justify-fix');
        //orderSystem.alert($($('#template-din-list-wrap').html()).find('.food-list').html())
        this.$dinListPanel.find('.i-loading').remove();
        //$fixHtml.appendTo(this.$dinListPanel.find('.food-list'));
        this.listHtml.append($fixHtml).one("webkitAnimationEnd", function () {
            $(this).removeClass('din-show');
        }).addClass('din-show');
        this.$dinListPanel.attr('has-data', 'true').prepend(this.listHtml).find('.food-list').eq(1).remove();
        iscroll.menu[this.model.attributes.id] = new iScroll(this.$dinListPanel[0]);
    },
    renderDinListItem: function (model) {
        var itemView = new orderSystem.View.dinList({ 'model': model });
        itemView.$el.wrapInner(itemView.template(itemView.model.toJSON())).appendTo(this.listHtml).after('\n');
    }
})

orderSystem.View.dinCat = Backbone.View.extend({
    el: ".menu-nav-list",
    initialize: function () {
        _.bindAll(this, 'render', 'renderItem');
        this.template = _.template($('#template-din-cat').html());
        return this;
    },
    render: function () {
        for (var i = 0; i < this.collection.models.length; i++) {
            this.renderItem(this.collection.models[i]);
        };
        return this;
    },
    renderItem: function (model) {
        var itemView = new orderSystem.View.dinCatItem({ 'model': model });
        this.$el.append(itemView.$el.wrapInner(this.template(itemView.model.toJSON())));
    }
})

//菜品列表
orderSystem.View.dinList = Backbone.View.extend({
    tagName: "li",
    events: {
        "tap .add": "dinAdd",
        "tap .minus": "dinMinus",
        "change select": "selectNum",
        "click .food-wrap": "showDetail"
    },
    initialize: function () {
        _.bindAll(this, "dinAdd", "dinMinus", "selectNum", "showDetail", "updataUI")
        this.template = _.template($('#template-din-list').html());
        this.detailTemplate = _.template($('#template-din-detail-item').html())
        this.model.on("change", this.updataUI);
    },
    dinAdd: function () {
        var ordNum = this.model.attributes.ordNum + 1;
        this.model.set({ "ordNum": ordNum })
    },
    dinMinus: function () {
        var ordNum = this.model.attributes.ordNum - 1;
        if (ordNum < 0) {
            if (this.model.attributes.total != 0) {
                orderSystem.alert("由于此菜品已下单，无法直接删减。你可到订单页进行操作或咨询服务员")
            }
            return false;
        }

        this.model.set({ "ordNum": ordNum });

    },
    selectNum: function () {
        var total=this.model.attributes.total;
        var ordNum = parseInt(this.$el.find('select').val()) - total;
        this.model.set({ "ordNum": ordNum });

    },
    updataUI: function () {
        
        if ($('#menu').length == 0) { return false;}
        var orderNum = parseInt(this.model.attributes.ordNum,10);
        var total = parseInt(this.model.attributes.total,10);
        var inOrderTotal = orderNum + total;

        //更新item
        if (inOrderTotal == 0) {
            this.$el.find('.food-wrap').removeClass('in-order');
        }
        else if (this.model.previous("ordNum") == 0 && this.model.attributes.total == 0) {
            this.$el.find('.food-wrap').addClass('in-order');
        }
        this.$el.find('.order-num').html('+<span>' + inOrderTotal + '</span>');

            var optionHtml = '';
            _.each(_.range(this.model.attributes.total, inOrderTotal>=11?inOrderTotal+1:11), function (item, index) {
                if (item == inOrderTotal) {
                    optionHtml += '<option selected>' + item + '</option>'
                }
                else{
                    optionHtml+='<option>'+item+'</option>'
                }
            });
            this.$el.find('select').html(optionHtml)
            //this.$el.find('select option').each(function (index, item) {
            //    if ($(this).text() == inOrderTotal) {
            //        this.selected = true;
            //        return false;
            //    } else if ($(this).text() < total) {
            //        $(this).remove();
            //    }
            //});
        
       

        //更新价格统计
        var totalData = orderSystem.datas.order["dinList"].calculate();
        var totalPrice = parsePrice(totalData.totalPrice);
        $('#din-count').html(totalData.totalNum);
        $('#din-price').html(totalPrice);

    },
    showDetail: function () {
        var dinDetail = new orderSystem.View.dinDetail({ model: this.model });
        var index = orderSystem.datas.detialIndex = this.model.collection.indexOf(this.model);
        dinDetail.setslider(index);
        $('.din-item-detail').addClass('pop in food-active').one("webkitAnimationEnd", function () {
            $(this).removeClass("pop in");
            $(this).one("webkitAnimationEnd", function () {
                $(this).removeClass("pop out food-active")
            })
        })
    }
})

orderSystem.View.dinDetail = Backbone.View.extend({
    tagName: "div",
    events: {
        "tap .add": "dinAdd",
        "tap .minus": "dinMinus",
        "change select": "selectNum",
        "swipeLeft .img": "swipeLeft",
        "swipeRight .img": "swipeRight"
    },
    attributes: {
        "class": "item"
    },
    initialize: function () {
        _.bindAll(this, "dinAdd", "dinMinus", "selectNum","updataUI", "setslider")
        var _self = this;
        this.template = _.template($('#template-din-detail-item').html());
        this.$el.wrapInner(this.template(this.model.toJSON())).appendTo($('.din-item-detail .wrap'));
        this.model.on("change:ordNum", this.updataUI);
        loadImg(this.$el.find("img"), function () {
            // _self.$el.find(".img").css("backgroundImage", "url(" + _self.$el.find("img").attr('src') + ")");
        });


    },
    dinAdd: function () {
        var ordNum = this.model.attributes.ordNum + 1;
        this.model.set({ "ordNum": ordNum })
    },
    dinMinus: function () {
        var ordNum = this.model.attributes.ordNum - 1;
        if (ordNum < 0) {
            if (this.model.attributes.total != 0) {
                orderSystem.alert("由于此菜品已下单，无法直接删减。你可到订单页进行操作或咨询服务员")
            }
            return false;
        }

        this.model.set({ "ordNum": ordNum });

    },
    selectNum: function () {
        var ordNum = parseInt(this.$el.find('select').val() - this.model.attributes.total, 10);
        this.model.set({ "ordNum": ordNum });
    },

    updataUI: function () {
        if ($('#menu').length == 0) { return false; }
        var orderNum = parseInt(this.model.attributes.ordNum, 10);
        var total = parseInt(this.model.attributes.total, 10);
        var inOrderTotal = orderNum + total;
        //更新item
        if (this.model.previous("ordNum") == 0) {
            this.$el.find('.corner').removeClass('hide-item')
        }
        else if (inOrderTotal == 0) {
            this.$el.find('.corner').addClass('hide-item')
        }
        this.$el.find('.order-num').html('<span>' + inOrderTotal + '</span>');
        var optionHtml = '';
        _.each(_.range(this.model.attributes.total, inOrderTotal >= 11 ? inOrderTotal + 1 : 11), function (item, index) {
            if (item == inOrderTotal) {
                optionHtml += '<option selected>' + item + '</option>'
            }
            else {
                optionHtml += '<option>' + item + '</option>'
            }
        });
        this.$el.find('select').html(optionHtml)
        //this.$el.find('.corner .order-num').html(orderNum);
        //if (orderNum > this.$el.find('select option').length - 1) {
        //    var $select = this.$el.find('select');
        //    $select.find('option').last().clone().appendTo($select).html(orderNum)
        //}
        //this.$el.find('select option').eq(orderNum)[0].selected = true;
    },
    swipeLeft: function () {//Next
        var _self = this;
        orderSystem.datas.haSwipe = true;
        $('.din-item-detail .wrap').addClass("animate").css({ '-webkit-transform': 'translate3d(-100%, 0, 0)' }).one("webkitTransitionEnd", function () {
            ++orderSystem.datas.detialIndex;
            $('.din-item-detail .item.prev').remove();
            $('.din-item-detail .item').not('.next').addClass('prev')
            $('.din-item-detail .item.next').removeClass("next");
            if (orderSystem.datas.detialIndex >= _self.model.collection.length) {
                orderSystem.alert("max")
                return false;
            }
            _self.sliderItem(orderSystem.datas.detialIndex+1,"next");
        });
        //var $info = $('.din-item-detail .wrap .item-detail').eq(0);
        //var h = $info.height();
        //$info.addClass("animate").css({ '-webkit-transform': 'translate3d(0, '+h+', 0)' });
    },
    swipeRight: function () {//Prev
        var _self = this;
        orderSystem.datas.haSwipe = true;
        $('.din-item-detail .wrap').addClass("animate").css({ '-webkit-transform': 'translate3d(100%, 0, 0)' }).one("webkitTransitionEnd", function () {
            --orderSystem.datas.detialIndex;
            $('.din-item-detail .item.next').remove();
            $('.din-item-detail .item').not('.prev').addClass('next')
            $('.din-item-detail .item.prev').removeClass("prev");
            if (orderSystem.datas.detialIndex <= 0) {
                orderSystem.alert("mix")
                return false;
            }
            _self.sliderItem(orderSystem.datas.detialIndex - 1,"prev");
        });
        //var $info = $('.din-item-detail .wrap .item-detail').eq(0);
        //var h = $info.height();
        //$info.addClass("animate").css({ '-webkit-transform': 'translate3d(0, ' + h + ', 0)' });
    },
    setslider: function (index) {
        var lastIndex = this.model.collection.length - 1
        if (index == 0 && index != lastIndex) {
            var dinDetail = new orderSystem.View.dinDetail({ model: this.model.collection.models[index + 1] })
            dinDetail.$el.addClass("next");
        } else if (index != 0 && index == lastIndex) {
            var dinDetail = new orderSystem.View.dinDetail({ model: this.model.collection.models[index - 1] })
            dinDetail.$el.addClass("prev");
        } else if (index != 0 && index != lastIndex) {
            var dinPrevDetail = new orderSystem.View.dinDetail({ model: this.model.collection.models[index - 1] });
            dinPrevDetail.$el.addClass("prev");
            var dinNextDetail = new orderSystem.View.dinDetail({ model: this.model.collection.models[index + 1] });
            dinNextDetail.$el.addClass("next");
        } else {
            return false;
        }
        
    },
    sliderItem: function (index,direction) {
        var dinDetail = new orderSystem.View.dinDetail({ model: this.model.collection.models[index], attributes: { "class": "item " + direction } })
    }
});

//订单分类
orderSystem.View.orderCatItem = Backbone.View.extend({
    tagName: "dl",
    events: {},
    initialize: function () {
        _.bindAll(this, 'goToDInList');
        this.template = _.template($('#template-order-cat').html());
        return this;
    },
    goToDInList: function (e) {
        e.stopPropagation();
        orderSystem.datas.dinCatId = "t_"+this.model.attributes.id;
        orderSystem.pages.menu(function () {
            $('#menu .page-back').hide();
            $('#order').remove();
        });
    }
});
orderSystem.View.orderCatList = Backbone.View.extend({
    el: '.os-order-content',
    initialize: function () {
        var _self = this;
        console.log()
        _.bindAll(this, 'render', 'renderItem');
        this.template = _.template($('#template-order-cat').html());
        orderSystem.datas.order["teaList"].each(function (model) {
            var teaItem = new orderSystem.View.orderItem({ 'model': model });
            $('#order-tea-list ol').append(teaItem.$el.wrapInner(teaItem.template(teaItem.model.toJSON())));
        });
        this.$el.find('.add').on('tap',this.goToDInList)
        return this;
    },
    render: function () {
        for (var i = 0; i < this.collection.models.length; i++) {
            this.renderItem(this.collection.models[i]);
        };
        return this;
    },
    renderItem: function (model) {
        
        var itemView = new orderSystem.View.orderCatItem({ 'model': model });
        this.$el.append(itemView.$el.wrapInner(this.template(itemView.model.toJSON())));
        //console.log(itemView.$el.find('.add').length)
        itemView.$el.find('.add').on('tap', itemView.goToDInList)
        //console.log(itemView.model)
        //该分类下的菜品
        var typeId = itemView.model.attributes.id;
        orderSystem.datas.order["dinList"].each(function (model) {
            if (model.attributes.typeId == typeId) {
                var orderItem = new orderSystem.View.orderItem({ "model": model });
                itemView.$el.find('ol').append(orderItem.$el.wrapInner(orderItem.template(orderItem.model.toJSON())));
                orderItem.$el.find('.number').html(orderItem.$el.index()+1);
            }
        });
        
        
        //collection.each(function (model, index) {
        //    console.log(model)
        //});
        
        //$item.find('')

    }
})
orderSystem.View.orderItem = Backbone.View.extend({
    tagName: "li",
    events: {
        'tap .add': 'dinAdd',
        'tap .minus': 'dinMinus',
        'change select': 'selectNum',
        'tap .submit-item': 'submitItem',
        'tap .cancel-order': 'cancelOrder',
        'tap .cancel-item': 'cancelItem',
        'tap .superaddition': 'superaddition'
    },
    initialize: function () {
        _.bindAll(this, "dinAdd", "updataUI", "updataStateUI", "submitItem", "cancelItem", "superaddition", "submitSuccess", "submitError", "cancelOrder", "cancelError", "cancelSuccess")
        this.template = _.template($('#template-order-item').html());
        this.model.on("change:ordNum", this.updataUI);
        this.model.on("change:state", this.updataStateUI);
        return this;
    },
    dinAdd: function () {
        var ordNum = this.model.attributes.ordNum + 1;
        this.model.set({ "ordNum": ordNum })
    },
    superaddition: function () {
        var _self = this;
        var selectHtml = "";
        if (orderSystem.datas.order["perNum"] < 10) {
            var perNum = 11;
        } else {
            var perNum = parseInt(orderSystem.datas.order["perNum"], 10) + 1;
        }

        _.each(_.range(0, perNum), function (item) {
            selectHtml+="<option>"+item+"</option>";
        })
        var contentHtml = "请选择要添加的数量：<select>" + selectHtml + "</select>";
        
        orderSystem.confirm(contentHtml, {
            "title":"添加 "+_self.model.attributes.dishName,
            "okCallback": function () {
                var selectNum = parseInt(this.$html.find('select').val(), 10);;
                if (selectNum != 0) {

                    //先查找此菜品是否存在 未下单
                    var inOrderModel = orderSystem.datas.order["dinList"].findWhere({ "state": 1, "dishId": _self.model.attributes.dishId })
                    if (typeof inOrderModel != "undefined") {
                        //存在 直接操作model
                        inOrderModel.set({ "ordNum": parseInt(inOrderModel.attributes.ordNum, 10) + selectNum })
                    } else {
                        //不存在订单 查找菜品列表 是否存在此model
                        var inDinListModel = inOrderModel = orderSystem.datas.dinListLoaded.findWhere({ "dishId": _self.model.attributes.dishId });

                        if (typeof inDinListModel != "undefined") {
                            //存在
                            inDinListModel.set({ "state": 1, "stateName": "未下单", "ordNum": selectNum })
                            orderSystem.datas.order["dinList"].add(inDinListModel);
                            var orderItem = new orderSystem.View.orderItem({ "model": inDinListModel });
                            _self.$el.parent().append(orderItem.$el.wrapInner(orderItem.template(orderItem.model.toJSON())));
                            iscroll.orderList[$('.order-list-wrap').index(_self.$el.parents('.order-list-wrap'))].refresh();
                            orderItem.$el.addClass('t').css({ "-webkit-transition-delay": "0.1s", "opacity": "1" })
                        } else {
                            //不存在  创建新的model 并标识此model，在菜品列表合拼时重新指向model
                            var newDInmodel = new orderSystem.Model.dinList(_self.model.toJSON());
                            newDInmodel.set({ "ordNum": selectNum,"temporary":true });
                            var inNewModel=inOrderModel = orderSystem.datas.order["dinList"].at(orderSystem.datas.order["dinList"].length - 1);

                            var orderItem = new orderSystem.View.orderItem({ "model": newDInmodel });
                            _self.$el.parent().append(orderItem.$el.wrapInner(orderItem.template(orderItem.model.toJSON())));
                            iscroll.orderList[$('.order-list-wrap').index(_self.$el.parents('.order-list-wrap'))].refresh();
                            orderItem.$el.addClass('t').css({ "-webkit-transition-delay": "0.1s", "opacity": "1" })
                        }
                        
                    }

                    orderItem.$el.find('.number').html(orderItem.$el.index() + 1);
                    orderSystem.alert('成功添加  ' + selectNum + inOrderModel.attributes.saleUnitName + ' ' + inOrderModel.attributes.dishName)

                    //添加菜品后提示下单
                    //orderSystem.confirm('成功添加' + selectNum + inOrderModel.attributes.saleUnitName + ' ' + inOrderModel.attributes.dishName + ' <br/> 订单中共有 <span style="color:#000;">' + inOrderModel.attributes.ordNum + inOrderModel.attributes.saleUnitName + '</span> 未下单，是否马上下单？', {
                    //    "okCallback": function () {
                    //        var ItemModel = new orderSystem.Model.orderDin({ "ordId": orderSystem.datas.order['id'], "dishInfo": inOrderModel.toJsonList() });
                    //        ItemModel.save(null, { success: _self.submitSuccess.call(inOrderModel), error: _self.submitError })
                    //    }
                    //});

                    if(orderSystem.datas.order["dinList"])
                    orderSystem.datas.order["dinList"].add()
                }
            }
        })
    },
    dinMinus: function () {
        var _self = this;
        var ordNum = this.model.attributes.ordNum - 1;
        if (ordNum == 0) {
            orderSystem.confirm(_self.model.attributes.dishName+" 数量为0，菜品将从订单中移除", {
                 "okCallback": function () {
                    _self.$el.css({ "opacity": 0 }).one('webkitTransitionEnd', function () {
                        _self.model.set({ 'ordNum': 0 });
                        orderSystem.datas.order["dinList"].remove(_self.model);
                        _self.$el.remove();
                    })
                }
            })
        } else {
            this.model.set({ "ordNum": ordNum });
        }
        
        
    },
    selectNum: function () {
        var ordNum = parseInt(this.$el.find('select').val());
        this.model.set({ "ordNum": ordNum });
        if (this.model.previous("ordNum") == 0) {
            this.$el.find('.food-wrap').addClass('in-order')
        }
        else if (ordNum == 0) {
            this.$el.find('.food-wrap').removeClass('in-order');
        }
    },
    updataUI: function () {

        if ($('#order').length == 0) { return false; }

        var orderNum = this.model.attributes.ordNum;

        //更新select
        //if (orderNum > this.$el.find('select option').length - 1) {
        //    var $select = this.$el.find('select');
        //    $select.find('option').last().clone().appendTo($select).html(orderNum)
        //}
        //if(this.$el.find('select').length!=0){
        //    this.$el.find('select option').eq(orderNum)[0].selected = true;
        //}
        var optionHtml = "";
        _.each(_.range(0, orderNum >= 11 ? orderNum + 1 : 11), function (item, index) {
            if (item == orderNum) {
                optionHtml += '<option selected>' + item + '</option>'
            }
            else {
                optionHtml += '<option>' + item + '</option>'
            }
        });
        this.$el.find('select').html(optionHtml)

        var totalPrice = parsePrice(this.model.attributes.price * orderNum);
        this.$el.find('.subtotal').html(totalPrice);
    },
    updataStateUI:function(){
        this.$el.html(this.template(this.model.toJSON()));
        this.$el.find('.number').html(this.$el.index() + 1);
    },
    submitItem: function () {
        var ItemModel = new orderSystem.Model.orderDin({ "ordId": orderSystem.datas.order['id'], "dishInfo": this.model.toJsonList() });
        ItemModel.save(null, { success: this.submitSuccess, error: this.submitError })
    },
    addItem: function () {

    },
    cancelItem: function () {
        var _self = this;
        var dinName=this.model.attributes.dishName;
        orderSystem.confirm('是否将 <span style="color:#000">'+dinName+'</span> 从订单中移除',{"okCallback":function(){
            _self.$el.css({ "opacity": 0 }).one('webkitTransitionEnd', function () {
                _self.model.set({ 'ordNum': 0 });
                orderSystem.datas.order["dinList"].remove(_self.model);
                var index = $('.order-list-wrap').index(_self.$el.parents('.order-list-wrap'));
                var $li = _self.$el.siblings();
                _self.$el.remove();
                $li.each(function (index,item) {
                    $(this).find('.number').html(index+1);
                })
                iscroll.orderList[index].refresh();
                
            })
        }})
    },
    submitError: function () {
        orderSystem.alert(" "+this.model.attributes.dishName+" 下单失败,请检测网络后再重试")
    },
    submitSuccess: function (model, reponse) {

        if (reponse.state == "1") {
            console.log(this)
            var _self = this;
            if (this.model == "undefined") {
                var _selfModel = this;
            } else {
                var _selfModel = this.model;
            }
            

            orderSystem.alert(" " + this.model.attributes.dishName + " 下单成功", {
                'callback': function () {
                    var ordNum = _selfModel.attributes.ordNum;
                    var totalNum = _selfModel.attributes.total;

                    _self.model.set({ "total": ordNum, "ordNum": 0, "state": "2", "stateName": "已下单" });
                    orderSystem.datas.order["dinList"].add(_selfModel.toJSON());

                    //重置model数据
                    _self.model.set({ "total": totalNum + ordNum, "ordNum": 0 })
                    //重置collection数据
                    orderSystem.datas.order["dinList"].remove(_selfModel);

                    _self.model = orderSystem.datas.order["dinList"].at(orderSystem.datas.order["dinList"].length - 1);
                    _self.model.on("change:state", _self.updataStateUI);
                }
            });
            
        }
    },
    cancelOrder: function () {
        var _self = this;
        var dinName = this.model.attributes.dishName;
        orderSystem.confirm('是否对 <span style="color:#000">' + dinName + '</span> 进行退单操作', {
            "okCallback": function () {

                    var ItemModel = new orderSystem.Model.orderCancelDin({ "odId": _self.model.attributes.dishId });
                    ItemModel.save(null, { success: _self.cancelSuccess, error: _self.cancelError })

            }
        })
        
    },
    cancelSuccess: function (model, reponse) {
        if (reponse.state == "1") {
            this.model.set({ "state": "0", "stateName": "已退单" });

            var dinModel = orderSystem.datas.dinListLoaded.findWhere({ "dishId": this.model.attributes.dishId, "typeId": this.model.attributes.typeId });

            if (typeof dinModel != "undefined") {
                dinModel.set({ "total": dinModel.attributes.total - this.model.attributes.total });
            } else if($('#menu').length){
                //更新价格统计

                var totalData = orderSystem.datas.order["dinList"].calculate();
                var totalPrice = parsePrice(totalData.totalPrice);
                $('#din-count').html(totalData.totalNum);
                $('#din-price').html(totalPrice);
            }

            
            orderSystem.alert(" " + this.model.attributes.dishName + " 退单成功");
        }
    },
    cancelError: function () {
        orderSystem.alert(" " + this.model.attributes.dishName + " 退单失败,请检测网络后再重试")
    }
})

orderSystem.View.orderSubmit = Backbone.View.extend({
    el: "#submit-order-all",
    initialize: function () {
        _.bindAll(this, "submitDInOrder", "submitSuccess", "submitError");
        this.$el.on('tap', this.submitDInOrder);
    },
    submitDInOrder: function () {
        var dishInfo = JSON.parse(orderSystem.datas.order["dinList"].toJsonList(["1"]));
        if(dishInfo.length!=0){
            var ItemModel = new orderSystem.Model.orderDin({ "ordId": orderSystem.datas.order['id'], "dishInfo": dishInfo });
            ItemModel.save(null, { success: this.submitSuccess, error: this.submitError })
        } else {
            orderSystem.alert("没有需要提交的菜品")
        }
    },
    submitSuccess: function (model,reponse) {
        if (reponse.state == "1") {
            
            orderSystem.datas.order["dinList"].clone().each(function (model) {
                
                var ordNum = model.attributes.ordNum;
                if (ordNum != 0) {
                    
                    
                    var totalNum = model.attributes.total;
                    model.set({ "total": ordNum, "ordNum": 0, "state": "2", "stateName": "已下单" });
                    orderSystem.datas.order["dinList"].add(model.toJSON());

                    //重置model数据
                    model.set({ "total": totalNum + ordNum,"ordNum":0 })
                    //重置collection数据
                    orderSystem.datas.order["dinList"].remove(model);
                }
                console.log(orderSystem.datas.order["dinList"])
            });
            orderSystem.alert("下单成功");
        }
    },
    submitError: function () {
        orderSystem.alert("下单失败,请检测网络后再重试")
    }
})

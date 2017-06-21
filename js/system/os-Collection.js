/// <reference path="../library/backbone.js" />
/// <reference path="../library/underscore.js" />
/// <reference path="../library/zepto.js" />
/// <reference path="../extend/cxui-page.js" />
/// <reference path="../os-config.js" />
/// <reference path="os-Collection.js" />
/// <reference path="os-Model.js" />
/// <reference path="os-View.js" />

/*os-Collection层
    Description：一个保存models的集合类,具有增加元素，删除元素，获取长度，排序，比较等一系列工具方法
    Author：zhangguoyong@revenco.com
    Created：2013/03/18
*/

orderSystem.Collection.empty = Backbone.Collection.extend({});

//茶品信息模块
orderSystem.Collection.teaList = Backbone.Collection.extend({
    model: orderSystem.Model.teaItem,
    url: orderSystem.urlRouter.data["teaList"],
    initialize: function () {
        _.bindAll(this, 'fetchSuccess', 'fetchError', 'parse')
        this.fetch({
            data: { _seq_dishStyle: 2 },
            success: this.fetchSuccess,
            error: this.fetchError
        });
        this.deferred = $.Deferred();
    },
    deferred: Function.constructor.prototype,
    fetchSuccess: function (collection, response) {
        collection.deferred.resolve();
        return response;
    },
    fetchError: function (collection, response) {
        alert("error");
    },
    parse: function (resp, xhr) {
        return resp;
    }
})
//已点茶品列表
orderSystem.Collection.teaOrder = Backbone.Collection.extend({
    initialize: function () {
        _.bind(this, 'calculate', 'toJsonList')
        //this.on('add remove', this.calculate)
    },
    calculate: function () {
        var price = 0;
        var num = 0;
        this.each(function (model) {
            num += model.attributes.ordNum;
            price += model.attributes.price * model.attributes.ordNum;
        });
        //console.log(num)
        return { "totalPrice": price, "totalNum": num };
    },
    toJsonList: function () {
        var newCollection = new orderSystem.Collection.empty();
        this.each(function (model) {
            newCollection.add(new orderSystem.Model.empty({"dishId":model.attributes.dishId,"ordNum":model.attributes.ordNum,"saleId":model.attributes.salePrices[0].saleId}));
        });

        return JSON.stringify(newCollection);
    }
});


//餐桌区域
orderSystem.Collection.areaCode = Backbone.Collection.extend({
    url: orderSystem.urlRouter.data["areaCode"],
    initialize: function () {
    }
});
//餐桌列表
orderSystem.Collection.tableList = Backbone.Collection.extend({
    url: orderSystem.urlRouter.data["tableList"],
    initialize: function () {
    }
});

//菜品分类列表
orderSystem.Collection.dinCatList = Backbone.Collection.extend({
    model:orderSystem.Model.dinCatItem,
    url: orderSystem.urlRouter.data["dinCat"],
    initialize: function () {
        _.bindAll(this, 'fetchSuccess', 'fetchError', 'parse');
        this.fetch({
            success: this.fetchSuccess,
            error: this.fetchError
        });
        this.deferred = $.Deferred();
    },
    deferred: Function.constructor.prototype,
    fetchSuccess: function (collection, response) {
        collection.deferred.resolve();
        return response;
    },
    fetchError: function (collection, response) {
        alert("菜品列表请求失败");
    },
    parse: function (resp, xhr) {
        return resp;
    }
})

//菜品列表
orderSystem.Collection.dinList = Backbone.Collection.extend({
    model:orderSystem.Model.dinList,
    url: orderSystem.urlRouter.data["dinList"],
    initialize: function () {
    }
})
//已加载的菜品列表
orderSystem.Collection.dinListLoaded = Backbone.Collection.extend({
    model: orderSystem.Model.dinList
});

//已点菜品列表
orderSystem.Collection.dinOrder = Backbone.Collection.extend({
    initialize: function () {
        _.bind(this, 'calculate', 'toJsonList', 'getSortList');
    },
    calculate:function(){
        var price = 0;
        var num = 0;
        this.each(function (model) {
            if (model.attributes.state != 0) {
                if (model.attributes.ordNum == 0) {
                    num += parseInt(model.attributes.total);
                    price += model.attributes.price * parseInt(model.attributes.total);
                } else {
                    num += parseInt(model.attributes.ordNum)
                    price += model.attributes.price * parseInt(model.attributes.ordNum);
                }
            }
        });

        return { "totalPrice": price, "totalNum": num };
    },
    toJsonList: function (stateArray) {

        var newCollection = new orderSystem.Collection.empty();
        if (stateArray === undefined) {
            this.each(function (model) {
                    newCollection.add(new orderSystem.Model.empty({ "dishId": model.attributes.dishId, "saleId": model.attributes.salePrices[0].saleId, "ordNum": model.attributes.ordNum }));
            });
        } else if ($.isArray(stateArray)) {
            var oldArray = stateArray;
            var newArray = [];
            _.each(oldArray, function (item,index) {
                newArray.push(parseInt(item));
            });
            this.each(function (model) {
                if ($.inArray(model.attributes.state, newArray) != -1) {
                    newCollection.add(new orderSystem.Model.empty({ "dishId": model.attributes.dishId, "saleId": model.attributes.salePrices[0].saleId, "ordNum": model.attributes.ordNum }));
                }
            });
        } else {
            alert("参数应为数组")
        }
        

        return JSON.stringify(newCollection);
        
    },
    getSortList: function (typeId) {
        return this.where({ "typeId": typeId })
    }
})

//订单
orderSystem.Collection.order = Backbone.Collection.extend({
    url: orderSystem.urlRouter.data["getOrder"],
    initialize: function () {
        _.bindAll(this, 'fetchSuccess', 'fetchError', 'parse');

        this.fetch({
            data: { _leq_ordId: orderSystem.datas.order["id"] },
            success: this.fetchSuccess,
            error: this.fetchError
        });
        this.deferred = $.Deferred();
    },
    deferred: Function.constructor.prototype,
    fetchSuccess: function (collection, response) {
        collection.deferred.resolve();
        return response;
    },
    fetchError: function (collection, response) {
        alert("获取订单失败");
    },
    parse: function (resp, xhr) {
        return resp;
    }
});

orderSystem.Collection.orderInfo = Backbone.Collection.extend({
    url: orderSystem.urlRouter.data["orderInfo"],
    initialize: function () {
        _.bindAll(this, 'fetchSuccess', 'fetchError', 'parse');

        this.fetch({
            data: { _leq_ordId: orderSystem.datas.order["id"] },
            success: this.fetchSuccess,
            error: this.fetchError
        });
        this.deferred = $.Deferred();
    },
    deferred: Function.constructor.prototype,
    fetchSuccess: function (collection, response) {
        collection.deferred.resolve();
        return response;
    },
    fetchError: function (collection, response) {
        alert("获取订单信息失败");
    },
    parse: function (resp, xhr) {
        return resp;
    }
});
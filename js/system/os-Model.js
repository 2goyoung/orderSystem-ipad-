/// <reference path="../library/backbone.js" />
/// <reference path="../library/underscore.js" />
/// <reference path="../library/zepto.js" />
/// <reference path="../extend/cxui-page.js" />
/// <reference path="../os-config.js" />
/// <reference path="os-Collection.js" />
/// <reference path="os-Model.js" />
/// <reference path="os-View.js" />

/*os-Mode层
    Description：表示应用中所有数据，数据的创建、校验、销毁和保存到服务端
    Author：zhangguoyong@revenco.com
    Created：2013/03/18
*/
orderSystem.Model.empty = Backbone.Model.extend({});

//登录模块
orderSystem.Model.login = Backbone.Model.extend({
    url: orderSystem.urlRouter.data["login"],
    initialize: function () {
        this.on('invalid', function (model, error) {
            orderSystem.alert(error)
        });
        this.on('request', function () {
            ospage.setLoadingText("登录验证中...").show();
        });
        this.on('error', this.error);
    },
    validate: function (attributes) {
        if (attributes.username == "") {
            if (attributes.password == "d41d8cd98f00b204e9800998ecf8427e") {
                return "用户名和密码不能为空";
            } else {
                return "用户名不能为空";
            }
        } else if (attributes.password == "d41d8cd98f00b204e9800998ecf8427e") {
            return "密码不能为空";
        }
    },
    error: function (model, xhr) {
        ospage.loading.hide();
        //setTimeout(function () { orderSystem.alert("错误码：" + xhr.status + "\n错误信息：" + xhr.statusText); }, 400);
    },
});

//注销模块
orderSystem.Model.logout = Backbone.Model.extend({
    url: orderSystem.urlRouter.data["logout"],
    initialize: function () {
        this.on('error', this.error);
    },
    error: function (model, xhr) {
        ospage.loading.hide();
        //orderSystem.alert("错误码：" + xhr.status + "\n错误信息：" + xhr.statusText);
    },
})

//茶品信息模块
orderSystem.Model.teaItem = Backbone.Model.extend({
    defaults:{
        ordNum: 0,
        total:0
    },
    initialize:function(){
        _.bind(this, 'changePanelOrder')
        this.on("change", this.changeCollection);
    },
    changeCollection: function () {
        var modelData = this.attributes;
        var teaListCollection = orderSystem.datas.order["teaList"];
        if (this.attributes.ordNum == 0) {
                teaListCollection.remove(teaListCollection.findWhere({ "dishId": modelData.dishId }));
        }
        else if (this.previous("ordNum") == 0) {
                teaListCollection.add(this);
                teaListCollection.findWhere({ "dishId": modelData.dishId }).set({ "ordNum": modelData.ordNum, "saleId": modelData.salePrices[0].saleId, "price": modelData.salePrices[0].price, "saleUnitName": modelData.salePrices[0].saleUnitName }, { silent: true })
        }
        else {
            teaListCollection.findWhere({ "dishId": modelData.dishId }).set({ "ordNum": modelData.ordNum });
            //teaListCollection.remove(teaListCollection.where({ "dishId": modelData.dishId }), {silent:true});
            //teaListCollection.add({ "dishId": modelData.dishId, "ordNum": modelData.ordNum, "saleId": modelData.salePrices.saleId, "price": modelData.salePrices.price })
        }
        
    }
})

//空桌开台
orderSystem.Model.createOrder = Backbone.Model.extend({
    url:orderSystem.urlRouter.data["createOrder"]
})

//茶品下单模块
//	提交数据：{ordId:aaa, cusNum: bbb, dishInfo:[{dishId:aaa, ordNum:bbb, saleId:ccc}]}
//说明：dishInfo为提交已下订的茶品信息数组，每个数组元素为茶品信息
//•	ordId为订单号，必填
//•	cusNum为人数，必填
//•	dishInfo为下订信息
//•	dishId为茶品标识，必填
//•	ordNum为下订数量，必填
//•	saleId为售卖标识，必填
orderSystem.Model.orderTeaList = Backbone.Model.extend({
    url:orderSystem.urlRouter.data["saveDish"],
    defaults: {
        //ordId:orderSystem.order['id']
    }
})

//菜品分类
orderSystem.Model.dinCatItem = Backbone.Model.extend({
    
})
//菜品列表
orderSystem.Model.dinList = Backbone.Model.extend({
    defaults: {
        ordNum: 0,
        total:0
    },
    initialize: function () {
        _.bind(this, 'changePanelOrder')
        this.on("change", this.changeCollection);
    },
    changeCollection: function () {
        var modelData = this.attributes;
        var dinListCollection = orderSystem.datas.order["dinList"];
        var price, saleUnitName, saleId;
        if (typeof modelData.salePrices == "undefined") {
            price = modelData.price;
            saleUnitName = modelData.saleUnitName;
            saleId = modelData.saleId;
        }
        else if (modelData.salePrices.length == 1) {
            price = modelData.salePrices[0].price;
            saleUnitName = modelData.salePrices[0].saleUnitName;
            saleId = modelData.salePrices[0].saleId;
        }
        else {
            _.each(modelData.salePrices, function (item, index) {
                if (item.saleType == "5") {
                    price = item.price;
                    saleUnitName = item.saleUnitName;
                    saleId = item.saleId;
                }
            })
        }
        if (this.attributes.ordNum == 0 ) {
            dinListCollection.remove(dinListCollection.findWhere({ "dishId": modelData.dishId,"state":1 }));
        }
        else if (this.previous("ordNum") == 0) {
            dinListCollection.add(this);
            //dinListCollection.findWhere({ "dishId": modelData.dishId }).set({ "ordNum": modelData.ordNum, "price": price, "state": 1, "stateName": "未下单" ,"saleUnitName":modelData.salePrices[0].saleUnitName}, { silent: true })
            //dinListCollection.add({ "dishId": modelData.dishId, "dishName": modelData.dishName, "salePrices": modelData.salePrices, "ordNum": modelData.ordNum, "price": price, "typeId": modelData.typeId, "state": 1, "stateName": "未下单" });
            dinListCollection.at(dinListCollection.length - 1).set({ "ordNum": modelData.ordNum, "price": price, "state": 1, "stateName": "未下单", "saleUnitName": saleUnitName, "saleId": saleId }, { silent: true })
        }
        else {
            dinListCollection.findWhere({ "dishId": modelData.dishId,"state":1 }).set({"ordNum":modelData.ordNum})
            //dinListCollection.remove(dinListCollection.where({ "dishId": modelData.dishId }), { silent: true });
            //dinListCollection.add({ "dishId": modelData.dishId, "dishName": modelData.dishName, "salePrices": modelData.salePrices, "ordNum": modelData.ordNum, "price": price, "typeId": modelData.typeId, "state": 1, "stateName": "未下单" });
        }
    },
    toJsonList: function () {
        var newCollection = new orderSystem.Collection.empty();
        newCollection.add(new orderSystem.Model.empty({ "dishId": this.attributes.dishId, "saleId": this.attributes.saleId, "ordNum": this.attributes.ordNum }));
        return JSON.stringify(newCollection);
    }
})

//菜品下单模块
//提交数据参考茶品数据
orderSystem.Model.orderDinList = Backbone.Model.extend({
    url: orderSystem.urlRouter.data["saveDish"],
    defaults: {
        //ordId:orderSystem.order['id']
    }
})

orderSystem.Model.orderDin = Backbone.Model.extend({
    url: orderSystem.urlRouter.data["saveDish"]
});

orderSystem.Model.orderCancelDin = Backbone.Model.extend({
    url: orderSystem.urlRouter.data["cancelDish"]
});

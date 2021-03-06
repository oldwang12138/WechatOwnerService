/**
 * 登录相关 代码封装
 * 
 * add by wuxw 2019-12-28
 * 
 */
/**
 * 登录工厂类
 */

const util = require("../utils/index.js");
const constant = require("../constant/index.js");

class LoginFactory {

  constructor() {
    this.coreUtil = util.core;
  }

  // 检查本地 storage 中是否有登录态标识
  checkLoginStatus(callback = () => { }) {
    let _that = this;
    let loginFlag = wx.getStorageSync(constant.mapping.LOGIN_FLAG);
    console.log("afterOneHourDate", loginFlag);
    let nowDate = new Date();
    if (loginFlag && loginFlag.expireTime > nowDate.getTime()) {
      // 检查 session_key 是否过期
      wx.checkSession({
        // session_key 有效(为过期)
        success: function () {
          console.log('判断用户是否登录');
          callback();
        },
        // session_key 过期
        fail: function () {
          // session_key过期
          _that.doLogin();
        }
      });
    } else {
      // 无登录态
      _that.doLogin(callback);
    }
  }

  // 登录动作
   doLogin(callback = () => { }) {
    let that = this;
    wx.login({
      success: function (loginRes) {
        if (loginRes.code) {
          // TODO
          //请求服务后端登录
          that.requsetHcServerToLogin(loginRes,callback);
        } else {
          // 获取 code 失败
          that.coreUtil.showInfo('登录失败');
          console.log('调用wx.login获取code失败');
        }
      },
      fail: function (error) {
        // 调用 wx.login 接口失败
        that.coreUtil.showInfo('接口调用失败' + error);
        console.log(error);
      }
    }); 
  }


/**
 * 请求 HC服务 登录
 */
  requsetHcServerToLogin(loginRes,callback = () => { }){
    let defaultRawData = '{"nickName":"","gender":1,"language":"","city":"","province":"","country":"","avatarUrl":""}';
    // 请求服务端的登录接口
    wx.request({
      url: constant.url.loginUrl,
      method: 'post',
      header: {
        APP_ID: constant.app.appId
      },
      data: {
        code: loginRes.code, // 临时登录凭证
        userInfo: JSON.parse(defaultRawData), // 用户非敏感信息
        signature: '', // 签名
        encryptedData: '', // 用户敏感信息
        iv: '' // 解密算法的向量
      },
      success: function (res) {
        console.log('login success...:');
        res = res.data;

        if (res.result == 0) {
          //that.globalData.userInfo = res.userInfo;
          console.log(res.userInfo);
          wx.setStorageSync(constant.mapping.USER_INFO, JSON.stringify(res.userInfo));
          let date = new Date();
          let year = date.getFullYear(); //获取当前年份
          let mon = date.getMonth(); //获取当前月份
          let da = date.getDate(); //获取当前日
          let h = date.getHours()+1; //获取小时
          let m = date.getMinutes(); //获取分钟
          let s = date.getSeconds(); //获取秒
          console.log("获取过去时间",year, mon, da, h, m, s)
          //将时间格式转化为时间戳
          let afterOneHourDate = new Date(year, mon, da, h, m, s);  //30s之后的时间
          console.log("afterOneHourDate", afterOneHourDate)
          wx.setStorageSync(constant.mapping.LOGIN_FLAG, { sessionKey: res.sessionKey, expireTime: afterOneHourDate.getTime()});
          wx.setStorageSync(constant.mapping.TOKEN, res.token);
          callback();
        } else {
          util.core.showInfo(res.errmsg);
        }
      },

      fail: function (error) {
        // 调用服务端登录接口失败
        util.core.showInfo('调用接口失败');
        console.log(error);
      }
    });
  }


  // 获取用户登录标示 供全局调用
   getLoginFlag() {
    return wx.getStorageSync(constant.mapping.LOGIN_FLAG);
  }

};

module.exports = new LoginFactory();
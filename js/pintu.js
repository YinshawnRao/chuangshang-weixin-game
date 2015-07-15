/*created by yunxiaor*/

$(function(){
	
	preventDragDefault();//防止用户上下拖动微信页面，影响css3动画

	var wsearch=window.location.search;//获取?后面参数

	var $cell=$(".grid-cell");//获取格子
	// $cell.removeClass("bed-cover");
	var $shadow=$(".shadow");//获取弹出层

	var isFirstTimeComeIn;//true表示是第一次进，false表示不是第一次进，至少是第二次进

	var passway;//用户进入方式，有oauth2和app入口

	var isOwnerIn;//true表示发起人进，false表示朋友进

	$(".attend").on("tap",function(){//点击参加按钮进入活动界面

		$(".wrapper").hide();//隐藏主页面

		$(".activity").show();//显示活动页面

	});

	$(".attend_s").on("tap",function(){
		$(".wrapper").hide();
		$(".activity").hide();
		$(".pintu_info").show();
	});

	/*判断进入方式*/

	if(wsearch.indexOf("openid")!=-1){//如果是从图文消息进

		isOwnerIn=true;

		passway="app";

		$(".btn_group_s").show();//首页显示参与活动，活动规则
		$(".btn_group").hide();
               if(wsearch.indexOf("&")!=-1){
			var openId=wsearch.substring(wsearch.indexOf("openid")+7,wsearch.indexOf("&"));
		}
		else{
			var openId=wsearch.substring(wsearch.indexOf("openid")+7);
		}

		$.post("get.php",{//传人appid和appsecret获取access_token
			type:"json",
			url:"https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid=wxb622443910a618d1&secret=ba9f37b7515fb1060573cda07fd91fe8"//此处使用的订阅号的appid
		},function(data){
			var res=JSON.parse(data);
			var token=res.access_token;//拿到access_token
			//请求view接口,传入openid
			$.ajax({
    			type:"get",
				async:"false",
				url:"http://lifeix-activity.l99.com/activity/pintu/view?openid="+openId,
				dataType:"jsonp",
				jsonp:"callbackparam",
				jsonpCallback:"success_jsonpCallback",
				success:function(data){

					var req_id=data.data.request_id;//拿到request_id
					var own_id=data.data.owner_id;//拿到owner_id

					var items=data.data.grid_items;//获取格子数据
					var openItems=data.data.result_items;//获取已经打开过的格子信息

					var hasFinish=data.data.finish_flag;
					var hasPrize=data.data.prize_flag;
					var prize_name=data.data.prize_name;
					var own_name=data.data.owner_name;


					// alert(openItems);
					//第一次进入
					if(own_id==undefined){//判断own_id为undefined

						isFirstTimeComeIn=true;

						weixin(isOwnerIn,isFirstTimeComeIn,req_id);//绑定微信事件,必须放最前面，为了避免用户进入页面一瞬间就点击分享到朋友圈，此时分享按钮可能还未来得及隐藏。

						loadGridItems(items);//装载拼图

						$cell.on("tap",function(){

							var index=$(this).index();
							$(".click_icon").hide();//隐藏提示图标

							$(this).removeClass("bed-cover");//掀床

							appendHeadpic(passway,token,openId,index);//第一次进入时插入头像

							saveGameData(passway,req_id,token,openId,index,isOwnerIn);//存储游戏数据

						});

					}
					else{//第n次进

						$(".wrapper").hide();//隐藏主页面

						$(".activity").show();//显示活动页面
							$(".shadow").removeClass("dark").addClass("transparent").show();//触发弹出层事件,此时没有阴影
							$(".prize_pan").hide();
							$(".prize_pan2").show();

						isFirstTimeComeIn=false;

						weixin(isOwnerIn,isFirstTimeComeIn,req_id);//绑定微信事件,必须放最前面，为了避免用户进入页面一瞬间就点击分享到朋友圈，此时分享按钮可能还未来得及隐藏。	

						loadGridItems(items);//装载拼图

						loadOpenItems(openItems,hasFinish,hasPrize,prize_name,isOwnerIn);//显示已经打开了的拼图

					}

				}
			});

		});

	}
	else{//如果是从朋友圈链接进，需使用认证的服务号才具有oauth2高级验证权限

		passway="oauth2";

		var code=wsearch.substring(wsearch.indexOf('code')+5,wsearch.indexOf('&state'));//获取code

		var rid=wsearch.substring(wsearch.indexOf('request_id')+11,wsearch.indexOf('&code'));//朋友圈进入的页面来源一定是图文消息，一定会带有request_id

		//向微信发送请求获取access_token和open_id
		$.post("get.php",{
    		"type":"json",
    		"url":"https://api.weixin.qq.com/sns/oauth2/access_token?appid=wx81df2a3da3888801&secret=400d9fa3bfd21a73a2d23475db9599b2&code="+code+"&grant_type=authorization_code"//通过服务号
    	},function(data){
    		var res = JSON.parse(data);

	        var token=res.access_token;//拿到access_token

	        var openId=res.openid;//拿到openid

	        // alert(openId);

	        //向view接口发送请求,朋友圈需传入request_id,这样可以接收到分享源的数据
	        $.ajax({
    			type:"get",
				async:"false",
				url:"http://lifeix-activity.l99.com/activity/pintu/view?openid="+openId+"&request_id="+rid,
				dataType:"jsonp",
				jsonp:"callbackparam",
				jsonpCallback:"success_jsonpCallback",
				success:function(data){

					var items=data.data.grid_items;//获取格子数据
					var req_id=data.data.request_id;//拿到request_id
					var own_id=data.data.owner_id;//拿到owner_id
					var openItems=data.data.result_items;//获取已经打开过的格子信息

					var hasFinish=data.data.finish_flag;
					var hasPrize=data.data.prize_flag;
					var prize_name=data.data.prize_name;
					var own_name=data.data.owner_name;

					$.post("get.php", {
				            "type": "json",
				            "url": "https://api.weixin.qq.com/sns/userinfo?access_token="+token+"&openid="+openId
				        }, function (data) {
				            var res = JSON.parse(data);	
				            
				       		var nickname=res.nickname;

				       		if(!checkNicknameInResult(nickname,openItems)) {//第一次进,肯定是朋友

				       			isOwnerIn=false;

								$(".btn_group_s").hide();
								$(".btn_group").show();//显示两个按钮,帮朋友或查看规则
								$(".attend_o").on("tap",function(){//点击帮朋友
									isFirstTimeComeIn=true;

									weixin(isOwnerIn,isFirstTimeComeIn,req_id);//绑定微信事件,必须放最前面，为了避免用户进入页面一瞬间就点击分享到朋友圈，此时分享按钮可能还未来得及隐藏。

									loadGridItems(items);//装载拼图

									loadOpenItems(openItems,hasFinish,hasPrize,prize_name,isOwnerIn);//显示已经打开了的拼图

									$cell.on("tap",function(){
										var index=$(this).index();
										$(".click_icon").hide();//隐藏提示图标
										$(this).removeClass("bed-cover");//掀床

										appendHeadpic(passway,token,openId,index);//插入头像
										
										saveGameData(passway,req_id,token,openId,index,isOwnerIn);//存储游戏数据

									});

									$.each(openItems,function(key,value){
										$cell.eq(value.gridIndex-1).off("tap");//已经打开的格子取消绑定事件
									});
								});
							}

							else{//第二次进

								isFirstTimeComeIn=false;

					       		if(nickname==own_name){//是本人进，肯定是第二次

					       			isOwnerIn=true;

					       			$(".wrapper").hide();//隐藏主页面

									$(".activity").show();//显示活动页面

									$(".shadow").removeClass("dark").addClass("transparent").show();//触发弹出层事件,此时没有阴影

									$(".prize_pan").hide();//隐藏抽中信息圆盘

									$(".prize_pan2").show();//显示第二部提示
								

									weixin(isOwnerIn,isFirstTimeComeIn,req_id);//绑定微信事件,必须放最前面，为了避免用户进入页面一瞬间就点击分享到朋友圈，此时分享按钮可能还未来得及隐藏。

									loadGridItems(items);//装载拼图

									loadOpenItems(openItems,hasFinish,hasPrize,prize_name,isOwnerIn);//显示已经打开了的拼图
					       		}	
					       		else{//朋友进

					       			$(".ac_banner").attr("src","pintu_images/activity_banner2.png");//换2号banner

					       			isOwnerIn=false;
					       			$(".btn_group_s").show();
									$(".btn_group").hide();


									weixin(isOwnerIn,isFirstTimeComeIn,req_id);//绑定微信事件,必须放最前面，为了避免用户进入页面一瞬间就点击分享到朋友圈，此时分享按钮可能还未来得及隐藏。

									loadGridItems(items);//装载拼图

									loadOpenItems(openItems,hasFinish,hasPrize,prize_name,isOwnerIn);//显示已经打开了的拼图

					       		}



							}

				        }
				    );

				}
			});




    	});

	}

	/*封装function*/

	//阻止用户上下拖动页面
	function preventDragDefault(){
		var obody = document.body;
        obody.addEventListener("touchstart", function (e) {
            e.preventDefault();
        });
        obody.addEventListener("touchmove", function (e) {
            e.preventDefault();
        });
        obody.addEventListener("touchend", function (e) {
            e.preventDefault();
        });
	}

	//装载六宫格拼图碎片
	function loadGridItems(items){
		$.each(items,function(key,value){
			$cell.eq(value.indexNum-1).append("<img src='"+value.picturePath+"' class='prize'>");//装载拼图
		});
	}
	//装载已经打开了的拼图碎片
	function loadOpenItems(openItems,hasFinish,hasPrize,prize_name,isOwnerIn){

		$.each(openItems,function(key,value){
			$cell.eq(value.gridIndex-1).removeClass("bed-cover").append("<span class='headimgs'><img src='"+value.headimgurl+"'></span>");
			// alert(value.openId);
			// appendHeadpic(passway,token,value.openId,value.gridIndex);//插入对应位置的头像,此处openid和index是遍历循环得到的
		});
		checkGameResult(hasFinish,hasPrize,prize_name,isOwnerIn);//检查游戏结果
	}

	//获取用户头像并插入
	function appendHeadpic(passway,token,openId,index){
		// alert(openId);
		if(passway=="oauth2"){//授权进来的
			var gUrl="https://api.weixin.qq.com/sns/userinfo?access_token="+token+"&openid="+openId;
		}
		else if(passway=="app"){//图文消息进来的
			var gUrl="https://api.weixin.qq.com/cgi-bin/user/info?access_token="+token+"&openid="+openId+"&lang=zh_CN";
		}
		$.post("get.php", {
	            "type": "json",
	            "url": gUrl
	        }, function (data) {
	            var res = JSON.parse(data);	
	            // alert(JSON.stringify(data));
	            // alert(res.headimgurl);
	            $cell.eq(index-1).append("<span class='headimgs'><img src='"+res.headimgurl+"'></span>");
	       		
	        }
	    );

	}

	//存储游戏数据
	function saveGameData(passway,req_id,token,openId,index,isOwnerIn){

		if(passway=="oauth2"){//授权进来的
			var gUrl="https://api.weixin.qq.com/sns/userinfo?access_token="+token+"&openid="+openId;
		}
		else if(passway=="app"){//图文消息进来的
			var gUrl="https://api.weixin.qq.com/cgi-bin/user/info?access_token="+token+"&openid="+openId+"&lang=zh_CN";
		}

		$.post("get.php", {
	            "type": "json",
	            "url": gUrl
	        }, function (data) {
	            var res = JSON.parse(data);	
	            
	           	var nickName=res.nickname;
	           	var headimg=res.headimgurl;

	       		//保存用户信息
				$.ajax({
					type:"post",
					url:"http://lifeix-activity.l99.com/activity/pintu/userinfo",
					data:{openid:openId,nickname:nickName,headimgurl:headimg},
					dataType:"json",
					success:function(data){
						// alert(JSON.stringify(data));
					}
				});
	        }
	    );
		

		//请求save接口保存数据
		$.ajax({
			type:"get",
			async:"false",
			url:"http://lifeix-activity.l99.com/activity/pintu/save?request_id="+req_id+"&openid="+openId+"&grid_index="+index,
			dataType:"jsonp",
			jsonp:"callbackparam",
			jsonpCallback:"success_jsonpCallback",
			success:function(data){

				if(isOwnerIn){
					$(".shadow").show();	//触发弹层	
				}
				else{
					$(".shadow").removeClass("dark").addClass('transparent').show();
					$(".sharing").show();//显示气泡
				}
				
			}
		});

	}

	//检查朋友的openid是否出现在已点过的格子里
	function checkNicknameInResult(nickname,openItems){
		var isIn=false;
		$.each(openItems,function(key,value){
			if(nickname==value.nickName){
				isIn=true;
			}
		});
		return isIn;
	}

	//微信
	function weixin(isOwnerIn,isFirstTimeComeIn,req_id){

		var sUrl=window.location.href.split('#')[0];//获取#前面的url用于微信签名算法
		var iUrl="http://"+window.location.hostname;//获取?前面的url用于加载分享logo小图标
		var rLink="https://open.weixin.qq.com/connect/oauth2/authorize?appid=wx81df2a3da3888801&redirect_uri=http%3a%2f%2flifeix-activity.l99.com%2fpintu_index.shtml?request_id="+req_id+"&response_type=code&scope=snsapi_userinfo&state=1#wechat_redirect";//获取微信长链接用于朋友圈分享跳转链接
		//请求signature接口获取微信配置所需参数
		$.ajax({
			type:"get",
			url:"http://xsemail.l99.com/rest/wxapi/jsSignature",
			data:{url:sUrl},
			dataType:"json",
			success:function(data){

				var params=[];
				$.each(data,function(key,value){
					$.each(value,function(k,v){
						params.push(v);//将获取到的配置参数存储在参数数组;
					});
				});

				wx.config({
					// debug:true,
					appId:"wx81df2a3da3888801",//此处appid需与后台代码一致,不然会报错config:invalid signature
					timestamp: params[0], 
			  		nonceStr: params[1],
			  		signature: params[2],
			  		jsApiList: [
				        'checkJsApi',
				        'onMenuShareTimeline',
				        'onMenuShareAppMessage',
				        'onMenuShareQQ',
				        'onMenuShareWeibo',
				        'hideMenuItems',
				        'showMenuItems',
				        'hideAllNonBaseMenuItem',
				        'showAllNonBaseMenuItem',
				        'translateVoice',
				        'startRecord',
				        'stopRecord',
				        'onRecordEnd',
				        'playVoice',
				        'pauseVoice',
				        'stopVoice',
				        'uploadVoice',
				        'downloadVoice',
				        'chooseImage',
				        'previewImage',
				        'uploadImage',
				        'downloadImage',
				        'getNetworkType',
				        'openLocation',
				        'getLocation',
				        'hideOptionMenu',
				        'showOptionMenu',
				        'closeWindow',
				        'scanQRCode',
				        'chooseWXPay',
				        'openProductSpecificView',
				        'addCard',
				        'chooseCard',
				        'openCard'
				      ]
				});
				
				wx.ready(function(){//配置成功


					if(isFirstTimeComeIn){//第一次进入
						if(isOwnerIn){
							$(".shadow").on("tap",function(){//点击全屏都可以
								weixinShare(rLink,iUrl);
								$(".shadow").removeClass("dark").addClass('transparent');
								$(".prize_pan").hide();
								$(".prize_pan2").hide();
								$(".sharing").show();//显示气泡
								
							});	
						}
						else{//帮朋友

							$cell.on("tap",function(){//点击全屏都可以
								weixinShare(rLink,iUrl);
								$(".prize_pan").hide();
								$(".prize_pan2").hide();
								
							});	
						}
						
					}

					else{//第n次进入,没翻完不需要点击就能显示提示

						$(".click_icon").hide();//隐藏悬浮层提示

						if(isOwnerIn){//本人进
							
							weixinShare(rLink,iUrl);


						}
						else{//朋友进

							$(".attend").on("tap",function(){

								weixinShare(rLink,iUrl);

								$(".shadow").removeClass("dark").addClass("transparent").show();//触发弹出层事件,此时没有阴影

								$(".sharing").show();

								$(".prize_pan").hide();//隐藏抽中信息圆盘

								$(".prize_pan2").hide();//显示第二部提示

								
							});
							
							
						}
							
					}

					wx.error(function(res){
						alert(res.errMsg);
					});
				});
			}
		});

	}

	//微信分享功能
	function weixinShare(rLink,iUrl){
		wx.onMenuShareTimeline({
			title:'“我宣你”万元大奖免费拿',
			desc:'试试你在床上的运气',
			link: rLink,
			imgUrl:iUrl+"/pintu_images/logo.png",
			success:function(res){

				wx.closeWindow();//分享成功则关闭活动页面
			},
			fail: function (res) {
        		// alert(JSON.stringify(res));
      		},
			cancel:function(res){
				alert("您还没分享到朋友圈哟~");
			}
		});
		wx.onMenuShareAppMessage({
			title:'“我宣你”万元大奖免费拿',
			desc:'试试你在床上的运气',
			link: rLink,
			imgUrl:iUrl+"/pintu_images/logo.png",
			success:function(res){
				wx.closeWindow();//分享成功则关闭活动页面
			},
			fail: function (res) {
        		// alert(JSON.stringify(res));
      		},
			cancel:function(res){
				alert("您还没分享到朋友圈哟~");
			}
		});
	}

	//检测游戏结果
	function checkGameResult(hasFinish,hasPrize,prize_name,isOwnerIn){

		var isContinue=false;

		if(isOwnerIn){//只有发起人能看到
			if(hasPrize){
					$(".click_icon").hide();
					$(".shadow").show();
					$(".prize_pan").hide();
					$(".prize_pan2").hide();
					$(".sharing").hide();//显示关注气泡
					$(".info_pan").html("恭喜你，中奖了！<br />奖品是"+prize_name).addClass("prize").show();
			}
			else if(hasFinish){
					$(".click_icon").hide();
					$(".shadow").show();
					$(".prize_pan").hide();
					$(".prize_pan2").hide();
					$(".sharing").hide();//显示关注气泡
					$(".info_pan").html("抱歉，您没中奖<br />感谢你的参与！").addClass("end").show();
			}
			else{
				//游戏尚未结束
				isContinue=true;
			}
		}
		
		return isContinue;
	}

});





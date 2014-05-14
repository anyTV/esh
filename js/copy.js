var myExt = angular.module('copyYAnnotations',['ui.bootstrap','scroll','ngSanitize']);
google = new GoogleResource();

function byId(id)
{
    return document.getElementById(id);
}

function homeCtrl($scope,youtubeServices,$rootScope,backgroundServices,dataServices)
{
    $rootScope.multiSelect= true;
    $scope.filters = [{name:'Show All', filter:{toggle:''}},
                    {name:'Show selected', filter:{toggle:1}}];
              
    $rootScope.hasAccessToken = google.hasAccessToken();
    loadXML(backgroundServices,$rootScope);
    backgroundServices.loadTemplates();
    console.log($rootScope.templates);
    chrome.tabs.getSelected(null, function(tab) 
    { 
        console.log(tab);
        $scope.pageTitle = tab.title.replace(/- YouTube/g,"");
        $scope.pageTitleShort = tab.title.replace(/- YouTube/g,"").substring(0,20) + "...";
        
        var annotationVId = getParameterByName("v",tab.url);
        if(annotationVId != "")
        {
            youtubeServices.queryVideoList(annotationVId).then(function(result)
            {
                console.log(result.items[0]);
                $rootScope.sourceVideoInfo = result.items[0];
                $rootScope.sourceVideoInfo.url = tab.url;
                
                var duration = $rootScope.sourceVideoInfo.contentDetails.duration;
                duration = duration.replace(/PT/g,"");
                duration = duration.replace(/M|H/g,":");
                duration = duration.replace(/S/g,".00");
                $rootScope.sourceVideoInfo.contentDetails.duration = duration;
            });
        }
    });
    
    youtubeServices.getUserInfo().then(function(data,status)
    {
        $rootScope.userInfo = data;
        dataServices.createUserDefaultCollection(data.id);
        youtubeServices.getGPlusInfo().then(function(data,status)
        {
            $rootScope.userInfo.displayName = data.displayName;
            dataServices.checkUserExist($rootScope.userInfo.email).then(function(exist)
            {
                console.log(exist);
                if(!exist) // add to database
                {
                    dataServices.insertUser({"email":$rootScope.userInfo.email,"name":$rootScope.userInfo.displayName}).then(function(insertResult)
                    {
                        console.log(insertResult);
                    });
                }
            });
        });
    });
    
    dataServices.createDefaultCollections();
    
    $scope.clearCollection = function()
    {
        chrome.storage.sync.clear(function(data)
        {
            console.log("CLEARED!");
        });
    }
    
    $rootScope.search = [];
    
    /*********************************************************************************/
    
    document.getElementById('resultVideos-container').style.display= "block";
    youtubeServices.queryChannels().then(function(datas,status)
    {
        $scope.viewControl = true;
        $rootScope.userInfo.channel = datas.items[0];
        console.log($rootScope.userInfo);
        youtubeServices.queryPlayListItems(datas.items[0].contentDetails["relatedPlaylists"].uploads,"").then(function(datas,status)
        {
            console.log("Total videos: "+datas.pageInfo.totalResults);
            $scope.nextPageToken = datas.nextPageToken;
            $scope.videos = datas.items;
            console.log($scope.videos);
            
            var ids = [];
            var i =0;
            angular.forEach($scope.videos,function(video)
            {
                if($rootScope.sourceVideoInfo != undefined)
                {
                    if(video.contentDetails.videoId == $rootScope.sourceVideoInfo.id)
                    $scope.videos.splice(i,1);
                }
                i++;
                ids.push(video.snippet.resourceId.videoId);
            });
            $scope.getDuration(ids);
        },function(reason)
        {
            //ERROR
            $rootScope.alerts = [{type:'error',msg:reason.msg}]
        });
        
        youtubeServices.getChannelInfo($rootScope.userInfo.channel.id).then(function(channels,status)
        {
            $rootScope.userInfo.channel.username = channels.entry.yt$username.$t;
            console.log($rootScope.userInfo.channel.username);
        });
        
    },function(reason)
    {
        //ERROR
        $rootScope.alerts = [{type:'error',msg:reason.msg}];
        // google.authorize(function(){
        // });
    });
    
    $scope.loadMore = function()
    {
        $rootScope.alerts = [{type:'info',msg:"Loading more videos..."}]
        if($scope.nextPageToken != undefined)
        {
            youtubeServices.queryPlayListItems($rootScope.userInfo.channel.contentDetails["relatedPlaylists"].uploads,$scope.nextPageToken).then(function(datas,status)
            {
                    $scope.nextPageToken = datas.nextPageToken;
                    // console.log($scope.nextPageToken);
                    angular.forEach(datas.items,function(item)
                    {
                        $scope.videos.push(item);
                    });
                    console.log($scope.videos);
                    
                    var ids = [];
                    var i=0;
                    angular.forEach(datas.items,function(video)
                    {
                        if($rootScope.sourceVideoInfo != undefined)
                        {
                            if(video.contentDetails.videoId == $rootScope.sourceVideoInfo.id)
                            $scope.videos.splice(i,1);
                        }
                        i++;
                         ids.push(video.snippet.resourceId.videoId);
                    });
                    $scope.getDuration(ids);
                
                $rootScope.alerts = [{type:'info',msg:"Done. Scroll down to load more."}]
            });
        }
        else
        {
            $rootScope.alerts = [{type:'info',msg:"Done loading all your videos"}]
        }
        
    }
    
    $scope.getDuration = function(ids)
    {
        youtubeServices.queryVideoList(ids).then(function(result)
        {
            angular.forEach($scope.videos,function(video)
            {
                var cont = true;
                angular.forEach(result.items,function(item)
                {
                    // console.log(video.contentDetails.videoId);
                    if(cont == true)
                    {
                        if(video.contentDetails.videoId == item.id)
                        {
                            var duration = item.contentDetails.duration.replace(/PT/g,"");
                            duration = duration.replace(/M|H/g,":");
                            duration = duration.replace(/S/g,".00");
                            video["duration"] = duration;
                            cont = false;
                        }
                    }
                });
            });
            console.log($scope.videos);
        });
    }
    
    $scope.selectState = "Select All";
    //selection toggler
    $scope.toggleVideo = function(id)
    {
        $scope.templates.isCollapsed = true;
        angular.forEach($scope.templates,function(template)
        {
            template.buttons = [];
        });
        
        $rootScope.alerts = [];
        // var cont = true;
        angular.forEach($scope.videos, function(video){  
            // if(cont == true)
            // {
                if(video["snippet"]["resourceId"]["videoId"] == id)
                {
                    (video["toggle"]== undefined)?(video["toggle"]=1):(video["toggle"]=undefined);
                    // cont = false;
                }
                else
                {
                    if($rootScope.multiSelect == false)
                        video["toggle"] = undefined; //comment if multi-select
                }
                    
            // }
        });
        
    }
    $rootScope.selected = [];
    $rootScope.selected.thereIs = true;
    $scope.toggleCheckbox = function()
    {
        $rootScope.selected = [];
        angular.forEach($scope.videos, function(video){  
            if(video["toggle"] == 1)
            {
                var item = {"id":video["snippet"]["resourceId"]["videoId"],"name":video["snippet"]["title"],"duration":video["duration"]};
                $rootScope.selected.push(item);
            }
        });
        
        if($scope.videos.length == $rootScope.selected.length)
            $scope.selectSate = "Deselect All";
        // console.log($rootScope.selected);
        
        if($rootScope.selected.length ==0)
        {
            $scope.vidLabel = "";
            $rootScope.selected.thereIs = true;
        }
        else
        {
            ($rootScope.selected.length == 1)?($scope.vidLabel = "to "+$scope.selected[0].name):($scope.vidLabel = "to "+$scope.selected.length +" Videos");
            $rootScope.selected.thereIs = false;
        }
             
    }
    //select all the videos
    $scope.selectAll = function()
    {
        $rootScope.selected = [];
        if ($scope.selectState == 'Select All')
        {
            angular.forEach($scope.videos, function(video)
            {   
                video["toggle"] = 1;
                var item = {"id":video["snippet"]["resourceId"]["videoId"],"name":video["snippet"]["title"],"duration":video["duration"]};
                $rootScope.selected.push(item);
                $scope.selectState = "Deselect All";
            });
        }
        else
        {
            angular.forEach($scope.videos, function(video)
            {
                video["toggle"] = undefined;
                $rootScope.selected=[]; 
                $scope.selectState = "Select All";
            });
        }
        ($rootScope.selected.length ==0)?($scope.vidLabel = ""):($rootScope.selected.length == 1)?($scope.vidLabel = "to "+$scope.selected[0].name):($scope.vidLabel = "to "+$scope.selected.length +" Videos");
        console.log($rootScope.selected);
    }
    
    $scope.logToDb= function(mode)
    {
        var optTemplate = arguments[1];
        var i =0,params=[];
        angular.forEach($rootScope.selected,function(video)
        {
            if(optTemplate)
            {
                params[i] = {"video_id":video.id,
                            "user_email":$rootScope.userInfo.email,
                            "title":video.name,
                            "template_id":(optTemplate.id)?(optTemplate.id):(""),
                            "template_buttons":(optTemplate.buttons)?(video.buttons):(""),
                            "xml_string":video.xml,
                            "mode":mode};
            }
            else
            {
                params[i] = {"video_id":video.id,
                            "user_email":$rootScope.userInfo.email,
                            "title":video.name,
                            "xml_string":video.xml,
                            "mode":mode};
            }
            console.log(params[i]);
            dataServices.insertLog2(params[i],optTemplate);
            i++;
        });
        
    }
    
    $scope.saveAnnotations = function(mode)
    {
        console.log(arguments[1]);
        if($rootScope.selected.length != 0)
        {
            $rootScope.completedData = {finished:new Array(),unfinished:new Array()};
            if($rootScope.hasAnnotations || arguments[1]!= undefined)
            {
                $rootScope.alerts = [{type:'info',msg:'Processing...'}];
                var template = arguments[1];
                if(arguments[1] != undefined && mode == "save")
                {
                    console.log("save in template");
                    youtubeServices.sendAnnotation("delete",template).then(function(deleteResult)
                    {
                        youtubeServices.sendAnnotation(mode,template,true).then(function(saveResult)
                        {
                            $scope.report(mode,saveResult);
                            $scope.logToDb(mode,template);
                        });
                    });
                }
                else if(arguments[1] != undefined && mode == "publish")
                {
                    console.log("publish in template");
                    
                    youtubeServices.sendAnnotation("delete",template).then(function(deleteResult)
                    {
                        youtubeServices.sendAnnotation("save",template,true).then(function(saveResult)
                        {
                            youtubeServices.sendAnnotation("publish",template,true).then(function(publishResult)
                            {
                                $scope.report(mode,publishResult);  
                                $scope.logToDb(mode,template);  
                            });
                        });
                    });
                }
                else
                {
                    if(mode == "delete")
                    {
                        if(confirm("Are you sure you want to clear?"))
                        {
                            youtubeServices.sendAnnotation(mode,template).then(function(data)
                            {
                                youtubeServices.sendAnnotation("publish",template,true).then(function(publishResult)
                                {
                                    $scope.report(mode,data);
                                    $scope.logToDb(mode,template);       
                                });
                            });
                        }
                        else
                            $rootScope.alerts = [];
                    }
                    else
                    {
                        var publishMode = false;                                        
                        if(mode == "publish")
                        {
                            publishMode = true;
                            mode = "save";
                        }       
                        youtubeServices.sendAnnotation(mode,arguments[1]).then(function(data)
                        {
                            // dataServices.insertLog($rootScope.userInfo.id,{"date":new Date().toUTCString(),"processed":data});
                            if(publishMode == true)
                            {
                                youtubeServices.sendAnnotation("publish",template,true).then(function(publishResult)
                                {
                                    $scope.report("publish",publishResult);
                                    $scope.logToDb("publish",template);  
                                })
                            }
                            else
                            {
                                $scope.report(mode,data);
                                $scope.logToDb(mode,template);  
                            }
                        },function(reason)
                        {
                            $rootScope.alerts = [{type:'error',msg:reason.msg}];
                        });
                    }
                    
                }
                //REMOVE THE CLEAR BUTTON IN TEMPLATE
                //REVERT FEATURE
                
            }
            else
                $rootScope.alerts = [{type:'error',msg:'Current video has no annotations.'}];
        }
        else
            $rootScope.alerts = [{type:'error',msg:'Select a video first'}];
        
    }
    
    $scope.report = function(mode,data)
    {
        switch(mode)
        {
            case "delete":$rootScope.alerts = [{type:'info',msg:'Clear Process Completed'}];break;
            case "publish":$rootScope.alerts = [{type:'info',msg:'Publish Process Completed'}];break;
            case "save":$rootScope.alerts = [{type:'info',msg:'Save Process Completed.'}];break;
        }
        // console.log(data);
        if($rootScope.multiSelect == false)
            $scope.overRideAlert(mode,data);
    }
    
    $scope.overRideAlert = function(mode,data)
    {
        if(data.finished.length == 1)
        {
            switch(mode)
            {
                case "delete":$rootScope.alerts = [{type:'info',msg:'Successfully Cleared'}];break;
                case "publish":$rootScope.alerts = [{type:'info',msg:'Successfully Published'}];break;
                case "save":$rootScope.alerts = [{type:'info',msg:'Successfully Saved.'}];break;
            }    
        }
        else if(data.finished.length == 0)
        {
            switch(mode)
            {
                case "delete":$rootScope.alerts = [{type:'error',msg:'Failed'}];break;
                case "publish":$rootScope.alerts = [{type:'error',msg:'Failed'}];break;
                case "save":$rootScope.alerts = [{type:'error',msg:'Failed.'}];break;
            }       
        }
        
    }
    
    $scope.openAnnotEditor = function()
    {
        var link = "http://www.youtube.com/my_videos_annotate?v=";
        chrome.tabs.getSelected(null, function(tab) {
              chrome.tabs.create({url:link+$rootScope.selected[0].id,index:tab.index+1,openerTabId:tab.id},
              function(tab) {
              });   
            });
    }
    
}

function headCtrl($scope,$rootScope,mongoServices)
{
    $rootScope.completedData = {finished:new Array(),unfinished:new Array()};
    $rootScope.alerts = [{ type: 'info', msg: 'Welcome to videobar.tm' }];
    $rootScope.userInfo = "";
    $scope.bindthis = function()
    {
        $rootScope.hasAccessToken = google.hasAccessToken();
        // if($rootScope.hasAccessToken)
        if(google.hasAccessToken())
        {
            google.authorize(function(){});
            // console.log(google.isAccessTokenExpired());
            // if(google.isAccessTokenExpired());
            // {
                // $rootScope.hasAccessToken = false;
                // google.authorize(function(){
                    // alert("yey");
                // });
            // }
            $scope.sessionBind = "Sign out";
        }
        else
        {
            $scope.userInfo.email = "";
            $scope.userInfo.displayName="";
            $scope.sessionBind = "Sign in with YouTube";
            // $rootScope.alerts.push({type:'warning',msg:'Sign in to use this tool'});
            // $rootScope.alerts = [{type:'warning',msg:"If you're already signed in, refresh this page"}];
        }
    }
    
    $scope.bindthis();
    
    // $scope.closeAlert = function(index) 
    // {
        // $scope.alerts.splice(index, 1);
    // };

    $scope.auth = function()
    {
        if(google.hasAccessToken())
        {
            google.clearAccessToken();
            $rootScope.alerts = [{type:'info',msg:'Successfully logged out'}];
            $scope.bindthis();
        }
        else
        {
            google.authorize();
            $scope.bindthis();
        }
    }
    
    $rootScope.openExternalLinks = function(link)
    {
          chrome.tabs.getSelected(null, function(tab) {
              chrome.tabs.create({url:link,index:tab.index+1,openerTabId:tab.id},
              function(tab) {
              });   
            });
    }
    
    $scope.searchItem = function()
    {
        console.log($scope.search);
        $rootScope.search = $scope.search;
    }


    $scope.testMongo = function()
    {
        alert("hi");
        mongoServices.saveVideobar({"user":"esh","videobar":"shit"});
    }
    
}

function optionsCtrl($scope,youtubeServices,$rootScope,dataServices)
{
    
    youtubeServices.getUserInfo().then(function(data,status)
    {
        dataServices.queryAllCollections().then(function(item)
        {
            console.log(item);
        });
    });
    
    
    $scope.doClick = function(){
        console.log('clear');
        google.clearAccessToken();
        alert("You have been logged out");
    };
}

function loadXML(backgroundServices,$rootScope)
{
    backgroundServices.hasAnnotation().then(function(data)
    {
        $rootScope.hasAnnotations = data;
        (!data)?($rootScope.alerts = [{type:'error',msg:'Video has no annotations.'}]):($rootScope.alerts = [{type:'info',msg:'Annotations found on this video'}]);
        
    },function(reason)
    {
        // $rootScope.alerts.push({type:'error',msg:reason.msg});
    });
}


myExt.directive('timeInput',function(){
    
    function checker()
    {
        return true;
    }
    
   return{
       restrict: 'E',
       replace:true,
       scope:{
           ngModel : '=',
           showthis: '='
       },
       template: '<div ng-show="showthis"><input ng-model = "ngModel.hrs" ng-change="timeInputChange()" type ="text" pattern="[0-9]{0,2}" required class="timeClass"/>:'+
                '<input ng-model = "ngModel.min" type  ="text" ng-change="timeInputChange()" pattern="[0-9]{0,2}" required class="timeClass"/>:'+
                '<input ng-model = "ngModel.sec" type  ="text" pattern="[0-9]{0,2}" required class="timeClass"/></div>',
        controller:function ($scope,$element)
        {
            console.log($scope.ngModel);
            // $scope.time =    
            console.log($scope);
            
            $scope.timeInputChange = function()
            {
                if($scope.ngModel.hrs == "")
                    $scope.ngModel.hrs = "00";
                else if($scope.ngModel.min == "")
                    $scope.ngModel.min = "00";
                else if($scope.ngModel.sec = "")
                    $scope.ngModel.sec = "00";
            }
        },
   }
    
});

myExt.directive('tabs', function() {
    return {
      restrict: 'E',
      transclude: true,
      scope: {},
      controller: function($scope, $element) {
        var panes = $scope.panes = [];
        $scope.select = function(pane) {
          angular.forEach(panes, function(pane) {
            pane.selected = false;
          });
          pane.selected = true;
        }

        this.addPane = function(pane) {
          if (panes.length == 0) $scope.select(pane);
          panes.push(pane);
        }
      },
      template:
        '<div class="tabbable">' +
          '<ul class="nav nav-tabs">' +
            '<li ng-repeat="pane in panes" ng-class="{active:pane.selected}">'+
              '<a href="" ng-click="select(pane)">{{pane.title}}</a>' +
            '</li>' +
          '</ul>' +
          '<div class="tab-content" ng-transclude></div>' +
        '</div>',
      replace: true
    };
});

 myExt.directive('pane', function() {
    return {
      require: '^tabs',
      restrict: 'E',
      transclude: true,
      scope: { title: '@' },
      link: function(scope, element, attrs, tabsCtrl) {
          console.log(tabsCtrl);
        tabsCtrl.addPane(scope);
      },
      template:
        '<div class="tab-pane" ng-class="{active: selected}" ng-transclude>' +
        '</div>',
      replace: true
    };
  })



myExt.directive('regexValidate', function(){
    return {
    
        // restrict to an attribute type.
        restrict: 'A',
        
        // element must have ng-model attribute.
        require: 'ngModel',
        
        // scope = the parent scope
        // elem = the element the directive is on
        // attr = a dictionary of attributes on the element
        // ctrl = the controller for ngModel.
        link: function(scope, elem, attr, ctrl) {
            
            //get the regex flags from the regex-validate-flags="" attribute (optional)
            var flags = attr.regexValidateFlags || '';
            
            // create the regex obj.
            var regex = new RegExp(attr.regexValidate, flags);            
                        
            // add a parser that will process each time the value is 
            // parsed into the model when the user updates it.
            ctrl.$parsers.unshift(function(value) {
                // test and set the validity after update.
                var valid = regex.test(value);
                ctrl.$setValidity('regexValidate', valid);
                
                // if it's valid, return the value to the model, 
                // otherwise return undefined.
                return valid ? value : undefined;
            });
            
            // add a formatter that will process each time the value 
            // is updated on the DOM element.
            ctrl.$formatters.unshift(function(value) {
                // validate.
                ctrl.$setValidity('regexValidate', regex.test(value));
                
                // return the value or nothing will be written to the DOM.
                console.log(value);
                return value;
            });
        }
    }
});
// var transformedInput = inputValue.match(/^(?:2[0-3]|[01]?[0-9]):(?:0?|[1-5])[0-9]:(?:0?|[1-5])[0-9](?:\.[0-9]|)$/);

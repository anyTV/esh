// var oauth = chrome.extension.getBackgroundPage().oauth; // this is for the official chrome extension oauth

google = new GoogleResource();
function byId(id) {
    return document.getElementById(id);
}

function homeCtrl($scope,youtubeServices,$rootScope,backgroundServices,dataServices) {
    $rootScope.dbLog = "Database log";
    // $rootScope.multiSelect= true;
    
    $scope.$watch("multi_select",function() {
        $rootScope.multiSelect = $scope.multi_select;
    });
    $scope.filters = [{name:'Saved', filter:{mode:'save'}},
    {name:'Published', filter:{mode:'publish'}},
    {name:'Deleted', filter:{mode:'delete'}},
    {name:'No template',filter:{mode:'none'}},
    {name:'All',filter:{mode:''}}];
              
    $rootScope.hasAccessToken = google.hasAccessToken();
    loadXML(backgroundServices,$rootScope);
    dataServices.loadTemplates();
    chrome.tabs.getSelected(null, function(tab) {
        $scope.pageTitle = tab.title.replace(/- YouTube/g,"");
        $scope.pageTitleShort = tab.title.replace(/- YouTube/g,"").substring(0,20) + "...";
        
        var annotationVId = getParameterByName("v",tab.url);
        if(annotationVId != "") {
            youtubeServices.queryVideoList(annotationVId).then(function(result) {
                logConsole("Query source video duration",result.items[0]);
                $rootScope.sourceVideoInfo = result.items[0];
                $rootScope.sourceVideoInfo.url = tab.url;
                $rootScope.sourceVideoInfo.contentDetails.duration = fixDuration($rootScope.sourceVideoInfo.contentDetails.duration);
            });
        }
    });
    
    youtubeServices.getUserInfo().then(function(data, status) {
        $rootScope.userInfo = data;
        dataServices.insertUser({"email":$rootScope.userInfo.email,"appToken":google.getAccessToken(),"appId":chrome.runtime.id}).then(function(insertResult) {
            //check video annotations in database
            dataServices.checkVideos($rootScope.userInfo.email).then(function(dbVideos, status) {
                $scope.dbVideos = dbVideos;
                //apply the mode from checked videos
                $scope.findMode2();
            }, function(reason) {
                $rootScope.error_checkVideo = true;
                $scope.findMode2();
            });
        });

        document.getElementById('resultVideos-container').style.display= "block";
        youtubeServices.queryChannels().then(function(datas,status) {
            $rootScope.userInfo.channel = datas.items[0];
            
            youtubeServices.queryPlayListItems($rootScope.userInfo.channel.contentDetails["relatedPlaylists"].uploads).then(function(datas,status) {
                $scope.nextPageToken = datas.nextPageToken;
                $scope.videos = datas.items;
                //apply extra informations in videos
                $scope.loadVideoExtra($scope.videos);
                $scope.viewControl = true;
            }, function(reason) { //PLiTEM ERROR 
                $rootScope.alerts = [{type:'error',msg:reason.msg}]
            });

            youtubeServices.getChannelInfo($rootScope.userInfo.channel.id).then(function(channels,status) {
                $rootScope.userInfo.channel.username = channels.entry.yt$username.$t;

                youtubeServices.getGPlusInfo().then(function(data,status) {
                    $rootScope.userInfo.displayName = data.displayName;
                    dataServices.insertUser({"email":$rootScope.userInfo.email,"name":$rootScope.userInfo.displayName,"channel_username":$rootScope.userInfo.channel.username}).then(function(insertResult) {});
                });

            });
            
        }, function(reason) { //QUERY CHANNEL ERROR 
            $rootScope.alerts = [{type:'error',msg:reason.msg}];
        });

    });

    // dataServices.createDefaultCollections();

    $scope.applyFilter = function(filter) {
        $scope.filterByToggle = filter;
    }

    $scope.clearCollection = function() {
        chrome.storage.sync.clear(function(data) {
            logConsole("Cleared",data);
        });
    }
    
    $rootScope.search = [];
    
    /*********************************************************************************/
    
    $scope.loadMore = function() {
        $rootScope.alerts_global = [{type:'info',msg:"Loading more videos..."}]
        if($scope.nextPageToken != undefined) {
            youtubeServices.queryPlayListItems($rootScope.userInfo.channel.contentDetails["relatedPlaylists"].uploads,$scope.nextPageToken).then(function(datas,status) {
                    $scope.nextPageToken = datas.nextPageToken;
                    angular.forEach(datas.items,function(item) {
                        $scope.videos.push(item);
                    });
                    //apply extra informations in videos
                    $scope.loadVideoExtra(datas.items);
                    // $scope.findMode2();
                $rootScope.alerts_global = [{type:'info',msg:"Done. Scroll down to load more."}]
            });
        }
        else
            $rootScope.alerts_global = [{type:'info',msg:"Done loading all your videos"}]
    }

    $scope.loadVideoExtra = function(videoItems)
    {
        var i =0,ids=[];
        angular.forEach(videoItems,function(video)
        {
            if($rootScope.sourceVideoInfo != undefined)
            {
                if(video.contentDetails.videoId == $rootScope.sourceVideoInfo.id)
                $scope.videos.splice(i,1);
            }
            i++;
             ids.push(video.snippet.resourceId.videoId);
             // video.mode = $scope.findMode(video.contentDetails.videoId);
        });
        $scope.getDuration(ids);
        $scope.findMode2();
    }
    
    $scope.findMode = function(vId)
    {
        var mode = "";
        var cont = true;
        var filteredVid = $scope.dbVideos.filter(function(val){return val.video_id === vId});
        (filteredVid.length ===0)?(mode='none'):(mode=filteredVid[0].mode);
        return mode;
    }

    $scope.findMode2 = function()
    {
        if($rootScope.error_checkVideo)
        {
            angular.forEach($scope.videos,function(video)
            {
                video.mode = "error";
            });
        }
        else
        {
            angular.forEach($scope.videos,function(video)
            {
                if($scope.dbVideos)
                {
                    var filteredVid = $scope.dbVideos.filter(function(val){return val.video_id === video.contentDetails.videoId});
                    (filteredVid.length ===0)?(video.mode='none'):(video.mode=filteredVid[0].mode);
                }
                else
                    video.mode="loading...";
            });
        }
    }

    $scope.getDuration = function(ids)
    {
        youtubeServices.queryVideoList(ids).then(function(result) {
            angular.forEach($scope.videos,function(video) {
                var cont = true;
                angular.forEach(result.items,function(item) {
                    if(cont == true)
                    {
                        if(video.contentDetails.videoId == item.id)
                        {
                            video["duration"] = fixDuration(item.contentDetails.duration);
                            cont = false;
                        }
                    }
                });
                
                video.snippet.publishedAt = video.snippet.publishedAt.replace(/T/g," ");
                var datePublished = new Date(video.snippet.publishedAt);
                
                video["date"] = datePublished;
            });
        });
    }
    
    $scope.toggleVideo = function(id) //selection toggler 
    {
        $scope.templates.isCollapsed = true;
        angular.forEach($scope.templates,function(template)
        {
            template.buttons = [];
        });
        
        $rootScope.alerts_global = [];
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
    
    $scope.logToDb= function(mode,data)
    {
        var optTemplate = arguments[2];
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
            else if(mode == "deleteall")
            {
                params[i] = {"video_id":video.id,
                            "user_email":$rootScope.userInfo.email,
                            "title":video.name,
                            "xml_string":video.xml,
                            "mode":"delete"};
            }
            else
            {
                params[i] = {"video_id":video.id,
                            "user_email":$rootScope.userInfo.email,
                            "title":video.name,
                            "xml_string":video.xml,
                            "mode":mode};
            }
            i++;
        });
        logConsole("DBParameters",params);

        if(mode == "deleteall")
            optTemplate=true;

        $rootScope.alerts = [{type:'info',msg:'Adding records to Database...'}];
        dataServices.insertLog2(params,optTemplate).then(function(res)
        {
            console.log(res);
            var alertInterval = setInterval(function(){ $scope.$apply($rootScope.alerts = []);clearInterval(alertInterval)},800);
            $scope.report(mode,data);
        },function(reason)
        {
            $rootScope.alerts = [{type:'error',msg:reason.msg}];
        });

        if(optTemplate)
        {
            angular.forEach($rootScope.selected,function(video)
            {
                
                var filteredValue = $scope.videos.filter(function(val){return val.contentDetails.videoId === video.id});
                filteredValue[0].mode = mode;

            });
        }
    }
    
    $scope.saveAnnotations = function(mode)
    {
        // console.log(arguments[1]);
        if($rootScope.selected.length != 0)
        {
            $rootScope.completedData = {finished:new Array(),unfinished:new Array()};
            if($rootScope.hasAnnotations || arguments[1]!= undefined || mode=="deleteall")
            {
                $rootScope.alerts = [{type:'info',msg:'Processing...'}];
                var template = arguments[1];
                if(arguments[1] != undefined && mode == "save")
                {
                    youtubeServices.sendAnnotation("delete",template).then(function(deleteResult) {
                        youtubeServices.sendAnnotation(mode,template,true).then(function(saveResult) {
                            $scope.logToDb(mode,saveResult,template);
                        });
                    });
                }
                else if(arguments[1] != undefined && mode == "publish")
                {
                    youtubeServices.sendAnnotation("delete",template).then(function(deleteResult) {
                        youtubeServices.sendAnnotation("save",template,true).then(function(saveResult) {
                            youtubeServices.sendAnnotation("publish",template,true).then(function(publishResult) {
                                $scope.logToDb(mode,publishResult,template);    
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
                            youtubeServices.sendAnnotation(mode,template).then(function(data) {
                                youtubeServices.sendAnnotation("publish",template,true).then(function(publishResult) {
                                    $scope.logToDb(mode,data,template);
                                });
                            });
                        }
                        else
                            $rootScope.alerts = [];
                    }
                    else if(mode == "deleteall")
                    {
                        if(confirm("Are you sure you want to clear all published annotations?"))
                        {
                            youtubeServices.sendAnnotation(mode).then(function(data) {
                                youtubeServices.sendAnnotation("publish",template,true).then(function(publishResult) {
                                    $scope.logToDb(mode,data);
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
                        youtubeServices.sendAnnotation(mode,arguments[1]).then(function(data) {
                            // dataServices.insertLog($rootScope.userInfo.id,{"date":new Date().toUTCString(),"processed":data});
                            if(publishMode == true)
                            {
                                youtubeServices.sendAnnotation("publish",template,true).then(function(publishResult) {
                                    $scope.logToDb("publish",publishResult,template);  
                                })
                            }
                            else
                                $scope.logToDb(mode,data,template); 
                        },function(reason) {
                            $rootScope.alerts = [{type:'error',msg:reason.msg}];
                        });
                    }
                    
                }
            }
            else
                $rootScope.alerts_global = [{type:'error',msg:'Current video has no annotations.'}];
        }
        else
            $rootScope.alerts_global = [{type:'error',msg:'Select a video first'}];
        
    }
    
    $scope.report = function(mode,data)
    {
        switch(mode)
        {
            case "delete":$rootScope.alerts = [{type:'info',msg:'Clear Process Completed'}];break;
            case "deleteall":$rootScope.alerts = [{type:'info',msg:'Clear all annotations completed'}];break;
            case "publish":$rootScope.alerts = [{type:'info',msg:'Publish Process Completed'}];break;
            case "save":$rootScope.alerts = [{type:'info',msg:'Save Process Completed.'}];break;
        }
        
        if($rootScope.multiSelect == false)
        {
            if(data.finished.length == 1)
            {
                switch(mode)
                {
                    case "delete":$rootScope.alerts = [{type:'info',msg:'Successfully Cleared'}];break;
                    case "deleteall":$rootScope.alerts = [{type:'info',msg:'Successfully Cleared all annotations'}];break;
                    case "publish":$rootScope.alerts = [{type:'info',msg:'Successfully Published'}];break;
                    case "save":$rootScope.alerts = [{type:'info',msg:'Successfully Saved.'}];break;
                }    
            }
            else if(data.finished.length == 0)
            {
                switch(mode)
                {
                    case "delete":$rootScope.alerts = [{type:'error',msg:'Failed'}];break;
                    case "deleteall":$rootScope.alerts = [{type:'info',msg:'Failed'}];break;
                    case "publish":$rootScope.alerts = [{type:'error',msg:'Failed'}];break;
                    case "save":$rootScope.alerts = [{type:'error',msg:'Failed.'}];break;
                }       
            }
        }
    }
    
    $scope.openAnnotEditor = function() {
        if($rootScope.alerts.length !=0) {
                alert("Please wait until the operation is finished");
        }
        else
        {
            var link = "http://www.youtube.com/my_videos_annotate?v=";
            chrome.tabs.getSelected(null, function(tab) {
                  chrome.tabs.create({url:link+$rootScope.selected[0].id,index:tab.index+1,openerTabId:tab.id},
                  function(tab) {
                  });   
                });
        }
    }
    $scope.openYoutubeVideo = function() {
        if($rootScope.alerts.length!=0)
            alert("Please wait until the operation is finished");
        else
        {
            var link = "http://www.youtube.com/watch?v=";
            chrome.tabs.getSelected(null, function(tab) {
                  chrome.tabs.create({url:link+$rootScope.selected[0].id,index:tab.index+1,openerTabId:tab.id},
                  function(tab) {
                  });   
                });
        }
    }
    $scope.closeAlert = function(index) {
        $scope.alerts.splice(index,1);
    }
    
}

function headCtrl($scope,$rootScope,mongoServices)
{
    $rootScope.completedData = {finished:new Array(),unfinished:new Array()};
    $rootScope.alerts_global = [{ type: 'info', msg: 'Welcome to Videobar on YouTube' }];
    $rootScope.userInfo = "";
    $scope.bindthis = function()
    {
        $rootScope.hasAccessToken = google.hasAccessToken();
        if(google.hasAccessToken())
        {
            google.authorize(function(){});
            $scope.sessionBind = "Sign out";
        }
        else
        {
            $scope.userInfo.email = "";
            $scope.userInfo.displayName="";
            $scope.sessionBind = "Sign in with YouTube";
        }
    }
    
    $scope.bindthis();

    $scope.auth = function()
    {
        // oauth.authorize(function()
        // {
        //     console.log(oauth.getAuthorizationHeader());
        // });

        if(google.hasAccessToken())
        {
            google.clearAccessToken();
            $rootScope.alerts_global = [{type:'info',msg:'Successfully logged out'}];
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
    
    $scope.searchItem = function() {
        $rootScope.search = $scope.search;
    }
}

function loadXML(backgroundServices,$rootScope)
{
    backgroundServices.hasAnnotation().then(function(data) {
        $rootScope.hasAnnotations = data;
        (!data)?($rootScope.alerts_global = [{type:'error',msg:'Video has no annotations.'}]):($rootScope.alerts = [{type:'info',msg:'Annotations found on this video'}]);
        
    },function(reason) {
        // $rootScope.alerts.push({type:'error',msg:reason.msg});
    });
}

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

function stringContains(s, match) {
    return s.indexOf(match)!==-1;
}

function fixDuration(s) {
    var duration = s.replace(/PT/g,"");
    duration = duration.replace(/M|H/g,":");

    if(stringContains(duration,"S"))
    {
        duration = duration.replace(/S/g,".00");
    }
    else
    {
        duration = duration+"00";
    }
    return duration;
}

function logConsole(logName, logObject)
{
    if(logObject)
    {
        console.log("-----------------START-------------------");
        console.log(logName+" :");
        console.log(logObject);
        console.log("------------------END--------------------");
        console.log("   ");
    }
    else
    {
        console.log(logName);
    }
}


// var transformedInput = inputValue.match(/^(?:2[0-3]|[01]?[0-9]):(?:0?|[1-5])[0-9]:(?:0?|[1-5])[0-9](?:\.[0-9]|)$/);

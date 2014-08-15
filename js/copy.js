var google = new GoogleResource();
var locale = chrome.i18n;

function byId(id) {
    return document.getElementById(id);
}

function homeCtrl($scope, youtubeServices, $rootScope, backgroundServices, dataServices) {
    $rootScope.dbLog = "Database log";
    // $rootScope.multiSelect= true;
    
    $rootScope.alerts_global = [{ type: 'info', msg: locale.getMessage("welcome") + " " + locale.getMessage("videobar") }];
    $rootScope.userInfo = "";
    $rootScope.completedData = {finished:[], unfinished:[]};
    $scope.$watch("multi_select",function() {
        $rootScope.multiSelect = $scope.multi_select;
    });

    $scope.filters = [{name:locale.getMessage("saved"), mode:'save'},
                    {name:locale.getMessage("published"), mode:'publish'},
                    {name:locale.getMessage("deleted"), mode:'delete'},
                    {name:locale.getMessage("no_template"),mode:'none'},
                    {name:locale.getMessage("all"),mode:''}];

    $scope.trans = function(key) {
        return locale.getMessage(key);
    }

    $scope.applyFilter = function(filter) {
        $scope.filter = filter;
    }
    
    $rootScope.search = [];
    $scope.videos = [];
    dataServices.loadTemplates();

    $scope.initialize = function() {
        loadSourceAnnotations(backgroundServices,$rootScope);
        chrome.tabs.getSelected(null, function(tab) {
            $scope.pageTitle = tab.title.replace(/- YouTube/g,"");
            $scope.pageTitleShort = tab.title.replace(/- YouTube/g,"").substring(0, 20) + "...";
            
            var video_src = getParameterByName("v",tab.url);
            if(video_src != "") {
                youtubeServices.queryVideoList(video_src).then(function(result) {
                    logConsole("Query source video duration", result.items[0]);
                    $rootScope.sourceVideoInfo = result.items[0];
                    $rootScope.sourceVideoInfo.url = tab.url;
                    $rootScope.sourceVideoInfo.contentDetails.duration = formatDuration($rootScope.sourceVideoInfo.contentDetails.duration);
                });
            }
        });
        
        youtubeServices.getUserInfo().then(function(data, status) {
            $rootScope.userInfo = data;
            dataServices.insertUser({
                                    "email":$rootScope.userInfo.email
                                    , "appToken":google.getAccessToken()
                                    , "appId":chrome.runtime.id
                                    })
            .then(function(insertResult) {
                //check video annotations in database
                dataServices.checkVideos($rootScope.userInfo.email)
                .then(function(saved_videos, status) {
                    $scope.saved_videos = saved_videos;
                    //apply the mode from checked videos
                    $scope.findMode();
                }, function(reason) {
                    $rootScope.error_checkVideo = true;
                    $scope.findMode();
                });
            });

            byId('resultVideos-container').style.display= "block";
            youtubeServices.queryChannels().then(function(channel, status) {
                $rootScope.userInfo.channel = channel.items[0];
                
                $scope.load_videos();
                $rootScope.alerts_global = [{type:'info',msg: locale.getMessage("load_video_finish") + " " + locale.getMessage("load_video_more")}];

                var queryChannelInterval = setInterval(function() { $scope.$apply($rootScope.alerts_global = []);clearInterval(queryChannelInterval)},1000);

                // window.setInterval(function() {
                //     $scope.$apply($rootScope.alerts_global = []);
                // },1000);

                youtubeServices.getChannelInfo($rootScope.userInfo.channel.id).then(function(channel, status) {
                    $rootScope.userInfo.channel.username = channel.entry.yt$username.$t;

                    youtubeServices.getGPlusInfo().then(function(gplus, status) {
                        $rootScope.userInfo.displayName = gplus.displayName;
                        dataServices.insertUser({"email":$rootScope.userInfo.email,"name":$rootScope.userInfo.displayName,"channel_username":$rootScope.userInfo.channel.username}).then(function(insertResult) {});
                    });

                });
                
            }, function(reason) { //QUERY CHANNEL ERROR 
                $rootScope.alerts_global = [{type:'error',msg:reason.msg}];
            });

        });
    }
    
    /*********************************************************************************/
    
    $scope.load_videos = function() {
        if($scope.nextPageToken) 
            $rootScope.alerts_global = [{type:'info',msg: locale.getMessage("loading_video_more")}];
        
        if($scope.videos.length == $scope.totalVideoCount) {
            return $rootScope.alerts_global = [{type:'info',msg: locale.getMessage("load_video_finish")}];
        }
        youtubeServices.queryPlayListItems($rootScope.userInfo.channel.contentDetails["relatedPlaylists"].uploads,
            ($scope.nextPageToken)?$scope.nextPageToken:'')
        .then(function(videos, status) {
            $scope.nextPageToken = videos.nextPageToken;
            $scope.totalVideoCount = videos.pageInfo.totalResults;
            angular.forEach(videos.items,function(item) {
                $scope.videos.push(item);
            });
            //apply extra informations in videos
            $scope.loadVideoExtra(videos.items);
            $scope.viewControl = true;
        }, function(reason) { //PLiTEM ERROR 
            $rootScope.alerts_global = [{type : 'error', msg: reason.msg}];
        });
    }

    $scope.loadVideoExtra = function(videoItems) {
        var i =0,ids=[];
        angular.forEach(videoItems,function(video) {
            if($rootScope.sourceVideoInfo != undefined) {
                if(video.contentDetails.videoId == $rootScope.sourceVideoInfo.id)
                $scope.videos.splice(i,1);
            }
            i++;
             ids.push(video.snippet.resourceId.videoId);
        });
        $scope.getDuration(ids);
        $scope.findMode();
    }

    $scope.findMode = function() {
        if($rootScope.error_checkVideo) {
            angular.forEach($scope.videos,function(video) {
                video.mode = "error";
            });
        }
        else {
            angular.forEach($scope.videos,function(video) {
                if($scope.saved_videos) {
                    var filteredVid = $scope.saved_videos.filter(function(val){return val.video_id === video.contentDetails.videoId});
                    (filteredVid.length ===0)?(video.mode='none'):(video.mode=filteredVid[0].mode);
                }
                else
                    video.mode="loading...";
            });
        }
    }

    $scope.getDuration = function(ids) {
        youtubeServices.queryVideoList(ids).then(function(result) {
            angular.forEach($scope.videos,function(video) {
                var cont = true;
                angular.forEach(result.items,function(item) {
                    if(cont == true) {
                        if(video.contentDetails.videoId == item.id) {
                            video["duration"] = formatDuration(item.contentDetails.duration);
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
    
    $rootScope.selected = [];
    $rootScope.selected.thereIs = true;
    $scope.toggleVideo = function(id) { //selection toggler
        $scope.templates.isCollapsed = true;
        angular.forEach($scope.templates,function(template) {
            template.buttons = [];
        });
        
        $rootScope.alerts_global = [];
        $rootScope.selected = []; //refresh selected
        angular.forEach($scope.videos, function(video) {
            if(video["snippet"]["resourceId"]["videoId"] == id) {
                (video["toggle"] == undefined)?(video["toggle"]=1):(video["toggle"]=undefined);
            }
            else {
                if($rootScope.multiSelect == false)
                    video["toggle"] = undefined; //comment if multi-select
            }
            if(video["toggle"] == 1) {
                var item = {"id":video["snippet"]["resourceId"]["videoId"],"name":video["snippet"]["title"],"duration":video["duration"]};
                $rootScope.selected.push(item);
            }
        });

        if($rootScope.selected.length ==0) {
            $scope.vidLabel = "";
            $rootScope.selected.thereIs = true;
        }
        else {
            var toMessage = locale.getMessage("to") + " ";
            ($rootScope.selected.length == 1)?($scope.vidLabel = toMessage+$scope.selected[0].name):($scope.vidLabel = toMessage+$scope.selected.length +" Videos");
            $rootScope.selected.thereIs = false;
        }
    }
    
    $scope.logToDb= function(mode,data) {
        if(data.status === 403) {
            alert(locale.getMessage("permission_err") + " " + locale.getMessage("switch_account", $rootScope.userInfo.displayName))
            var link = "https://www.youtube.com/";
            chrome.tabs.getSelected(null, function(tab) {
              chrome.tabs.create({ url : link, index : tab.index+1, openerTabId : tab.id },
              function(tab) {
              });   
            });
        }
        var optTemplate = arguments[2];
        var i =0, params=[];
        angular.forEach($rootScope.selected,function(video) {
            if(optTemplate) {
                params[i] = {"video_id":video.id,
                            "user_email":$rootScope.userInfo.email,
                            "title":video.name,
                            "template_id":(optTemplate.id)?(optTemplate.id):(""),
                            "template_buttons":(optTemplate.buttons)?(video.buttons):(""),
                            "xml_string":video.xml,
                            "mode":mode};
            }
            else if(mode == "deleteall") {
                params[i] = {"video_id":video.id,
                            "user_email":$rootScope.userInfo.email,
                            "title":video.name,
                            "xml_string":video.xml,
                            "mode":"delete"};
            }
            else {
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

        $rootScope.alerts = [{type:'info',msg: locale.getMessage("database_add") + "..." }];
        dataServices.insertLog2(params,optTemplate).then(function(res) {
            var alertInterval = setInterval(function() { $scope.$apply($rootScope.alerts = []);clearInterval(alertInterval)},800);
            $scope.report(mode,data);
        },function(reason) {
            $rootScope.alerts = [{type:'error',msg:reason.msg}];
        });

        if(optTemplate) {
            angular.forEach($rootScope.selected,function(video) {
                var filteredValue = $scope.videos.filter(function(val){return val.contentDetails.videoId === video.id});
                filteredValue[0].mode = mode;
            });
        }
    }

    $scope.copyAnnotations = function(mode) {
        $rootScope.completedData = {finished:[], unfinished:[]};
        if($rootScope.selected.length != 0) {
            if($rootScope.hasAnnotations) {
                $rootScope.alerts = [{type : 'info', msg : locale.getMessage("processing") + "..."}];

                var publishMode = false;
                if(mode === "publish") {
                    publishMode = true;
                    mode = "save";
                }
                youtubeServices.sendAnnotation(mode).then(function(data) {
                    $rootScope.completedData = data;
                    if(publishMode === true) {
                        youtubeServices.sendAnnotation("publish",template,true).then(function(publishResult) {
                            $scope.logToDb("publish",publishResult,template);  
                        });
                    }
                    else $scope.logToDb(mode,data,template);
                }, function(reason) {
                    $rootScope.alerts = [{type:'error',msg:reason.msg}];
                });
            } else $rootScope.alerts_global = [{type:'error',msg: locale.getMessage("no_annotations")}];
        }
    }

    $scope.deleteAnnotations = function(mode) {
        $rootScope.completedData = {finished:[], unfinished:[]};
        if($rootScope.selected.length != 0) {
            $rootScope.alerts = [{type:'info',msg: locale.getMessage("processing") + "..."}];
            if(mode == "delete") {
                var template = arguments[1];
                if(confirm(locale.getMessage("clear_confirm"))) {
                    youtubeServices.sendAnnotation(mode, template).then(function(data) {
                        $rootScope.completedData = data;
                        youtubeServices.sendAnnotation("publish", null, true).then(function(publishResult) {
                            $scope.logToDb(mode, data, template);
                        });
                    }, function(reason) {
                        $rootScope.alerts = [{type:'error',msg:reason.msg}];
                    });
                }
                else
                    $rootScope.alerts = [];
            }
            else if(mode == "deleteall") {
                if(confirm(locale.getMessage("clear_confirm_all"))) {
                    youtubeServices.sendAnnotation(mode).then(function(data) {
                        $rootScope.completedData = data;
                        youtubeServices.sendAnnotation("publish", null, true).then(function(publishResult) {
                            $scope.logToDb(mode,data);
                        });
                    }, function(reason) {
                        $rootScope.alerts = [{type:'error',msg:reason.msg}];
                    });
                }
                else
                    $rootScope.alerts = [];
            }
        }
        else $rootScope.alerts_global = [{type:'error',msg: locale.getMessage("select_video_err")}];
    }
    
    $scope.saveAnnotations = function(mode) {
        $rootScope.completedData = {finished:[], unfinished:[]};
        if($rootScope.selected.length != 0) {
            $rootScope.alerts = [{type:'info',msg: locale.getMessage("processing") + "..."}];
            var template = arguments[1];
            if(template != undefined) {

                var publishMode = false;
                if(mode === "publish") {
                    publishMode = true;
                    mode = "save";
                }
                youtubeServices.sendAnnotation("delete",template).then(function(deleteResult) {
                    youtubeServices.sendAnnotation(mode, template, true).then(function(saveResult) {
                        $rootScope.completedData = saveResult;
                        if(publishMode === true) {
                            youtubeServices.sendAnnotation("publish", null, true).then(function(publishResult) {
                                $scope.logToDb("publish", publishResult, template);    
                            });
                        }
                        else $scope.logToDb(mode, saveResult, template);
                    });
                }, function(reason) {
                    $rootScope.alerts = [{type:'error',msg:reason.msg}];
                });
            }
            else $rootScope.alerts_global = [{type:'error',msg: locale.getMessage("no_template_err")}];
        }
        else
            $rootScope.alerts_global = [{type:'error',msg: locale.getMessage("select_video_err")}];
        
    }
    
    $scope.report = function(mode,data)
    {
        switch(mode) {
            case "delete":$rootScope.alerts = [{type:'info',msg: locale.getMessage("clear_complete")}];break;
            case "deleteall":$rootScope.alerts = [{type:'info',msg: locale.getMessage("clear_all_complete")}];break;
            case "publish":$rootScope.alerts = [{type:'info',msg: locale.getMessage("publish_complete")}];break;
            case "save":$rootScope.alerts = [{type:'info',msg: locale.getMessage("save_complete")}];break;
        }
        
        if($rootScope.multiSelect == false) {
            if(data.finished.length == 1) {
                switch(mode) {
                    case "delete":$rootScope.alerts = [{type:'info',msg: locale.getMessage("clear_success")}];break;
                    case "deleteall":$rootScope.alerts = [{type:'info',msg: locale.getMessage("clear_all_success")}];break;
                    case "publish":$rootScope.alerts = [{type:'info',msg: locale.getMessage("publish_success")}];break;
                    case "save":$rootScope.alerts = [{type:'info',msg: locale.getMessage("save_success")}];break;
                }    
            }
        }
        if(data.finished.length == 0) {
            switch(mode) {
                case "delete":$rootScope.alerts = [{type:'error',msg: locale.getMessage("failed")}];break;
                case "deleteall":$rootScope.alerts = [{type:'info',msg: locale.getMessage("failed")}];break;
                case "publish":$rootScope.alerts = [{type:'error',msg: locale.getMessage("failed")}];break;
                case "save":$rootScope.alerts = [{type:'error',msg: locale.getMessage("failed")}];break;
            }       
        }
    }
    
    $scope.openAnnotEditor = function() {
        if($rootScope.alerts && $rootScope.alerts.length != 0) {
            alert( locale.getMessage("please_wait") );
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
        if($rootScope.alerts && $rootScope.alerts.length != 0)
            alert( locale.getMessage("please_wait") );
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

    $scope.auth = function() {
        $scope.userInfo.email = "";
        $scope.userInfo.displayName = "";
        $scope.auth_text = locale.getMessage("sign_in");

        if(google.hasAccessToken()) {
            $rootScope.alerts_global = [{type:'info',msg: locale.getMessage("logging_out") + '...'}];
            google.clearAccessToken(function(err, token) {
                if(err) {
                    $scope.$apply($rootScope.alerts_global = [{type:'error', msg:err.message}]);
                }
                console.log(token);
                $scope.$apply($rootScope.alerts_global = [{type:'info',msg: locale.getMessage("logout_success")}]);
                $scope.$apply($rootScope.hasAccessToken = false);
                $scope.auth_text = locale.getMessage("sign_in");
                return;
            });
        }
        else {
            $rootScope.alerts_global = [{type:'info',msg: locale.getMessage("signing") + '...'}];
            google.authorize(function(err, token) {
                if(err) {
                    $scope.$apply($rootScope.alerts_global = [{type:'error', msg:err.message}]);
                }
                else {
                    $scope.auth_text = locale.getMessage("sign_out");
                    $scope.$apply($rootScope.alerts_global = [{type:'info',msg: locale.getMessage("signin_success")}]);
                    $rootScope.hasAccessToken = true;
                    $scope.initialize();
                }
            });
        }
    }

    $scope.auth();
        
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


function loadSourceAnnotations(backgroundServices,$rootScope)
{
    backgroundServices.hasAnnotation().then(function(data) {
        $rootScope.hasAnnotations = data;
        (!data)?($rootScope.alerts_global = [{type:'error',msg: locale.getMessage("no_annotations")}]):($rootScope.alerts_global = [{type:'info',msg: locale.getMessage("annot_found")}]);
        
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

function formatDuration(s) {
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

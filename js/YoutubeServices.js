/**
 * @author esh
 */

myExt.factory("youtubeServices",function($http,$q,backgroundServices,$rootScope,annotationsServices)
{
    this.mode = "";
    this.token = "";
    this.sourceVideoInfo = "";
    this.template = "";
    
    var channelUsername;
    
    function getMode(){
        return this.mode;
    }
    function getToken(){
        return this.token;
    }
    function getSourceVideoInfo(){
        return this.sourceVideoInfo;
    }
    function getTemplate(){
        return this.template;
    }
    function setMode(newData){
        this.mode = newData;
    }
    function setToken(newData){
        this.token = newData;
    }
    function setSourceVideoInfo(newData){
        this.sourceVideoInfo = newData;
    }
    function setTemplate(newData){
        if(arguments[1]!=undefined)
            this.template[arguments[1]] = newData;
        else
            this.template = newData;
    }
    function deleteTemplateObject(objectToDelete)
    {
        delete this.template[objectToDelete];
    }
    function isTemplate()
    {
        if(this.template != undefined)
            return true;
        else 
            return false;
    }
    
    function getChannelUsername(id)
    {
        var deferred = $q.defer();
        var sendURL2 = "https://gdata.youtube.com/feeds/api/users/"+id;
        
        $http({method:'GET',
        url:sendURL2,
        params:{alt:"json"},
        headers:{'Content-Type':'*/*','Authorization':'OAuth '+google.getAccessToken(),"GData-Version":2,"Cache-Control":"no-cache"}
            }).success(function(data,status,headers,config)
            {
                deferred.resolve(data,status);
                
            }).error(function(data,status,headers,config)
            {
                console.log("error!");
                deferred.resolve(data,status);
            });
        return deferred.promise;
    }
    
    function process()
    {
        console.log(getMode());
        console.log(getToken());
        console.log(getSourceVideoInfo());
        
        var videos = $rootScope.selected;
        var processCount = videos.length;
        var deferred = $q.defer();
                            var finished = [];
                            var unfinished = [];
                            var publishXML = "<document></document>"; //standard
                            
                            // var cleanAlert = '\[|\]|"';
                            // var cleanAlert2 = "\{id:(.+?):|\}|,duration:(.+?)(?=(,|\]))";
                            
                            console.log(isTemplate());
                            
                            
                            
                            if(getMode() == "publish")
                            {
                                //<document><requestHeader video_id="X" /><authenticationHeader auth_token="Y" /></document>
                                
                                /******************************************************/
                                    var xmlList = [];
                                    var i=0;
                                    videos.forEach(function(video){
                                        
                                        xmlList[i] = annotationsServices.updateXML(publishXML,{"video":video.id,"token":getToken()});
                                        console.log(xmlList[i]);
                                        
                                        backgroundServices.sendXML(xmlList[i],getMode(),video).then(function(result)
                                        {
                                            console.log(result);
                                            if(result.status == 200)
                                                finished.push(result.video);
                                            else
                                                unfinished.push(result.video);
                                                
                                            // var strFinishedVids = JSON.stringify(finished).replace(new RegExp(cleanAlert,"g"),"").replace(new RegExp(cleanAlert2,"g"),"");
                                            // var strUnfinishedVids = JSON.stringify(unfinished).replace(new RegExp(cleanAlert,"g"),"").replace(new RegExp(cleanAlert2,"g"),"");
                                            // $rootScope.alerts = [
                                            // {type:'success',msg:'<span class="label label-info>'+finished.length+'</span> Successfully Published. <abbr title = "'+strFinishedVids+'"><span class="label label-info">Info</span></abbr>'+''},
                                                                // ];
//                                             
                                            // if(unfinished.length!=0)
                                                // $rootScope.alerts.push({type:'error',msg:'<span class="label label-error>'+unfinished.length+'</span> Failed. <abbr title = "'+strUnfinishedVids+'"><span class = "label label-info">Info</span></abbr>'});
                                            
                                            $rootScope.completedData = {"finished":finished,"unfinished":unfinished};
                                            // return result here
                                            if(finished.length+unfinished.length == processCount)
                                                deferred.resolve({"finished":finished,"unfinished":unfinished,"mode":result.mode}); 
                                        });
                                        i++;
                                    });
                                    /******************************************************/
                            }
                            else
                            {
                                if(isTemplate())
                                {
                                        
                                                if(getMode() == "delete")
                                                {
                                                    var i=0;
                                                    var xmlClearList =[];
                                                    videos.forEach(function(video){
                                                    
                                                        // annotationsServices.getAnnotationTemplateOnly(getTemplate(),video).then(function(xml)
                                                        // {   
                                                            console.log(getTemplate());
                                                            // xmlClearList[i] = xml;
                                                            xmlClearList[i] = annotationsServices.getAnnotationTemplateOnly(getTemplate(),video);
                                                            var xmlString = new XMLSerializer().serializeToString(xmlClearList[i]);
                                                            // xmlString = xmlString.replace(/http:\/\/www\.youtube\.com\/watch\?v=[-A-Za-z0-9_]{11}/g,'http://www.youtube.com/watch?v='+video.id);
                                                            xmlClearList[i] = annotationsServices.updateXML(xmlString,{"video":video.id,"token":getToken()},getMode());
                                                            console.log(xmlClearList[i]);
                                                            backgroundServices.sendXML(xmlClearList[i],getMode(),video).then(function(result)
                                                            {
                                                                if(result.status == 200) // then publish
                                                                {
                                                                    console.log(result);   
                                                                    // var newXML = annotationsServices.updateXML(publishXML,{"video":result.video.id,"token":getToken()});
                                                                    
                                                                    // backgroundServices.sendXML(newXML,"publish",result.video).then(function(published)
                                                                    // {
                                                                        // console.log(published);
                                                                        (result.status == 200)?(finished.push(result.video)):(unfinished.push(result.video));
//                                                                             
                                                                        // $rootScope.completedData = {"finished":finished,"unfinished":unfinished};
                                                                        // // return published;  
                                                                        if(finished.length+unfinished.length == processCount)
                                                                            deferred.resolve({"finished":finished,"unfinished":unfinished,"mode":result.mode}); 
                                                                    // });
                                                                }
                                                            });
                                                        // });
                                                        i++;
                                                    });
                                                        
                                                }
                                                else
                                                {
                                                    var xmlList = [], i=0;
                                                    videos.forEach(function(video)
                                                    {
                                                        console.log($rootScope.multiSelect);
                                                        // if($rootScope.multiSelect == false || videos.length == 1)
                                                            var result = annotationsServices.customizeTemplate(video);
                                                        // else
                                                        // {
                                                        //     console.log("many");
                                                        //     var result = annotationsServices.analyzeIds(getTemplate().url,getTemplate().xml_ids,video)
                                                        //     setTemplate(result.objects,"buttons");
                                                        //     console.log(getTemplate());
                                                        //     var result = annotationsServices.customizeTemplate(getTemplate(),video);
                                                        // }
                                                        xmlList[i] = result.xml;
                                                        // video.buttons = result.buttons;
                                                       i++;
                                                    });
                
                                                    i=0;
                                                    videos.forEach(function(video){
                                                        
                                                            var xmlString = new XMLSerializer().serializeToString(xmlList[i]);
                                                            // xmlString = xmlString.replace(/http:\/\/www\.youtube\.com\/watch\?v=[-A-Za-z0-9_]{11}/g,'http://www.youtube.com/watch?v='+video.id);
                                                            xmlList[i] = annotationsServices.updateXML(xmlString,{"video":video.id,"token":getToken()},getMode());
                                                            console.log(xmlList[i]);
                                                            video.xml = new XMLSerializer().serializeToString(xmlList[i]);
                                                            backgroundServices.sendXML(xmlList[i],getMode(),video).then(function(result)
                                                            {
                                                                        console.log(result.mode);
                                                                        (result.status == 200)?(finished.push(result.video)):(unfinished.push(result.video));
                                                                        
                                                                        $rootScope.completedData = {"finished":finished,"unfinished":unfinished};
                                                                        // return result; 
                                                                        // deleteTemplateObject(buttons);
                                                                        // console.log(getTemplate());
                                                                        if(finished.length+unfinished.length == processCount)
                                                                            deferred.resolve({"finished":finished,"unfinished":unfinished,"mode":result.mode});  
                                                            });
                                                        
                                                        i++;
                                                    });
                                                }
                                                    
                                                // console.log(templateXML.getElementsByTagName("annotations"));
                                                // console.log(changeNodeName("annotation","deletedItem",templateXML.getElementsByTagName("annotations")[0]));
                                                // console.log(templateXML);
                                }
                                else
                                {
                                    backgroundServices.getAnnotation(getSourceVideoInfo().url).then(function(xmlString,status)
                                    {
                                        getChannelUsername($rootScope.userInfo.channel.id).then(function(channels,status)
                                        {
                                            // console.log(channels.entry.yt$username.$t);
                                                xmlString = xmlString.replace(/http:\/\/www\.youtube\.com\/([A-Za-z0-9]?)"/g,'http://www.youtube.com/'+channels.entry.yt$username.$t.toString());
                                                xmlString = xmlString.replace(/http:\/\/www\.youtube\.com\/subscription_center\?add_user=[A-Za-z0-9]*/g,'http://www.youtube.com/subscription_center?add_user='+channels.entry.yt$username.$t.toString());
                                                xmlString = xmlString.replace(/http:\/\/www\.youtube\.com\/user\/[A-Za-z0-9]*/g,'http://www.youtube.com/user/'+channels.entry.yt$username.$t.toString());
                                            
                                            /******************************************************/
                                            
                                            var xmlList = [], i=0;
                                            videos.forEach(function(video){
                                                xmlString = xmlString.replace(/http:\/\/www\.youtube\.com\/watch\?v=[-A-Za-z0-9_]{11}/g,'http://www.youtube.com/watch?v='+video.id);
                                                xmlList[i] = annotationsServices.updateXML(xmlString,{"video":video.id,"token":getToken()},getMode());
                                                
                                                if(getMode() == "save")
                                                {
                                                    var annotationsSorted = annotationsServices.decodeXML(xmlList[i],hmsToSeconds(getSourceVideoInfo().contentDetails.duration));
                                                    annotationsServices.fixTime(annotationsSorted,{"source":hmsToSeconds(getSourceVideoInfo().contentDetails.duration),"destination":hmsToSeconds(video.duration)}); 
                                                }
                                                
                                                console.log(xmlList[i]);
                                                video.xml = new XMLSerializer().serializeToString(xmlList[i]);
                                                backgroundServices.sendXML(xmlList[i],getMode(),video).then(function(result)
                                                {
                                                    if(result.status == 200 && getMode() == "delete") // then publish
                                                    {
                                                        console.log(result);
                                                        // var newXML = annotationsServices.updateXML(publishXML,{"video":result.video.id,"token":getToken()});
                                                        // backgroundServices.sendXML(newXML,"publish",result.video).then(function(published)
                                                        // {
                                                            // console.log(published);
                                                            (result.status == 200)?(finished.push(result.video)):(unfinished.push(result.video));
//                                                                 
                                                            // $rootScope.completedData = {"finished":finished,"unfinished":unfinished};
                                                            // // return published;  
                                                            if(finished.length+unfinished.length == processCount)
                                                                deferred.resolve({"finished":finished,"unfinished":unfinished,"mode":result.mode}); 
                                                        // });
                                                    }
                                                    else
                                                    {
                                                            console.log(result.mode);
                                                            (result.status == 200)?(finished.push(result.video)):(unfinished.push(result.video));
                                                            
                                                            $rootScope.completedData = {"finished":finished,"unfinished":unfinished};
                                                            // return result; 
                                                            if(finished.length+unfinished.length == processCount)
                                                                deferred.resolve({"finished":finished,"unfinished":unfinished,"mode":result.mode});  
                                                    }
                                                });
                                                i++;
                                            });
                                            /******************************************************/
                                        });
                                        
                                    });
                                }
                            }
                            
                            
                                
                            
        return deferred.promise;
    }
    
    return{
        getChannelInfo:function(id)
        {
            return getChannelUsername(id);  
        },
        getGPlusInfo:function()
        {
            var youtube = new YoutubeResource({type:"getPeople"});
            var deferred = $q.defer();
            $http({method:'GET',
            url:youtube.queryURL("",{fields:"displayName"},{}),
            headers:{'Content-Type':'application/data','Authorization':'OAuth '+google.getAccessToken()}
                }).success(function(data,status,headers,config)
                {
                    // console.log(status);
                    console.log(data);
                    deferred.resolve(data,status);
                    
                }).error(function(data,status,headers,config)
                {
                    console.log("error!");
                    deferred.reject({"msg":"Unable to find your GPlus info.","status":status});
                });
                
            return deferred.promise;
        },
        getUserInfo:function()
        {
            var youtube = new YoutubeResource({type:"userinfo"});
            var deferred = $q.defer();
            $http({method:'GET',
            url:"https://www.googleapis.com/oauth2/v2/userinfo",
            headers:{'Content-Type':'application/data','Authorization':'OAuth '+google.getAccessToken()}
                }).success(function(data,status,headers,config)
                {
                    // console.log(status);
                    console.log(data);
                    deferred.resolve(data,status);
                    
                }).error(function(data,status,headers,config)
                {
                    console.log("error!");
                    deferred.reject({"msg":"Unable to find your channel.","status":status});
                });
                
            return deferred.promise;
        },
        queryChannels:function()
        {
            var youtube = new YoutubeResource({type:"listChannels"});
            var deferred = $q.defer();
            $http({method:'GET',
            url:youtube.queryURL("id,contentDetails",{mine:true},
                {
                    // mine:true                    
                })+Math.random(),
            headers:{'Content-Type':'application/data','Authorization':'OAuth '+google.getAccessToken()}
                }).success(function(data,status,headers,config)
                {
                    // console.log(status);
                    console.log(data);
                    deferred.resolve(data,status);
                    
                }).error(function(data,status,headers,config)
                {
                    console.log("error!");
                    deferred.reject({"msg":"Unable to find your channel.","status":status});
                });
                
            return deferred.promise;
        },
        queryPlayListItems:function(plId, pageToken)
        {
            var youtube = new YoutubeResource({type:"listPlaylistItems"});
            var deferred = $q.defer();
            $http({method:'GET',
            url:youtube.queryURL("snippet,contentDetails",{playlistId:plId.toString()},
                {
                    // playlistId:plId.toString(),
                    maxResults:"20",
                    pageToken:pageToken,
                    fields:'items/snippet(publishedAt,channelId,title,description,thumbnails,resourceId),pageInfo,nextPageToken'
                })+Math.random(),
            headers:{'Content-Type':'application/data','Authorization':'OAuth '+google.getAccessToken()}
                }).success(function(data,status,headers,config)
                {
                    console.log(data);
                    deferred.resolve(data,status);
                    
                }).error(function(data,status,headers,config)
                {
                    console.log("error!");
                    deferred.reject({"msg":"Unable to query your videos.","status":status});
                });
                
            return deferred.promise;
               
        },
        queryVideoList:function(vidIds)
        {
            var ids = JSON.stringify(vidIds);
            ids = ids.replace(/"/g,"");
            ids = ids.replace(/\[|\]/g,"");
            console.log(ids);
            var youtube = new YoutubeResource({type:"listVideos"});
            var deferred = $q.defer();
            $http({method:'GET',
            url:youtube.queryURL("contentDetails",{id:ids},
                {
                    // id:ids,
                    maxResults:"50",
                    fields:'items/contentDetails,id'
                }),
            headers:{'Content-Type':'application/data','Authorization':'OAuth '+google.getAccessToken()}
                }).success(function(data,status,headers,config)
                {
                    console.log(data);
                    deferred.resolve(data,status);
                    
                }).error(function(data,status,headers,config)
                {
                    console.log("error!");
                    deferred.reject({"msg":"Unable to query video durations.","status":status});
                });
                
            return deferred.promise;
            
        },
        sendAnnotation:function(mode)
        {
            
            var template = arguments[1]; //optional
            var consecutive = arguments[2]; //optional
            var videos = $rootScope.selected;
            var deferred = $q.defer();
            var token = "";
            var newURL = "http://www.youtube.com/my_videos_annotate?v=" + videos[0].id;
            var continueProcess = true;
            
            if(consecutive == true)
            {
                setMode(mode);
                setSourceVideoInfo($rootScope.sourceVideoInfo);
                setTemplate(template);
                console.log(template);
                console.log(isTemplate());
                process().then(function(result){deferred.resolve(result);});
            }
            else
            {
                chrome.tabs.create({ url: newURL,active:false }, function(tab)
                {
                    chrome.extension.onMessage.addListener(function(request, sender) {
                        if(continueProcess == true)
                        {
                            if (request.action == "getSource") 
                            {
                                var from = request.source.indexOf('"auth_token":');
                                var to = request.source.substring(from).indexOf(",");
                                var auth_token = request.source.substring(from,to+from);
                                auth_token = auth_token.replace(/"/g,"");
                                console.log(auth_token);
                                var auth = auth_token.split(" ");
                                if(auth[0] == "auth_token:")
                                    token = auth[1];
                                else
                                    token = undefined;
                                request = null;
                                sender = null;
                            }
                        }
                    });
                    
                    chrome.tabs.executeScript(
                        tab.id,
                        {
                            file:"js/getPageSource.js"
                        },
                        function(data) //callback
                        {
                            if(err = chrome.extension.lastError)
                                alert("There was an error injecting script : "+err.message);
                            chrome.tabs.remove(tab.id);
                            console.log(token);
                            setToken(token);
                            continueProcess = false;
                            
                            setMode(mode);
                            setSourceVideoInfo($rootScope.sourceVideoInfo);
                            setTemplate(template);
                            process().then(function(result){deferred.resolve(result);});
                        });
                });
            }
            
            
            return deferred.promise;
        }
    } // return brace
});

angular.module('scroll', []).directive('whenScrolled', function() {
    return function(scope, elm, attr) {
        var raw = elm[0];
        
        elm.bind('scroll', function() {
            if (raw.scrollTop + raw.offsetHeight >= raw.scrollHeight) {
                scope.$apply(attr.whenScrolled);
            }
        });
    };
});

function getParameterByName(name,url) {
    name = name.replace(/[\[]/, "\\\[").replace(/[\]]/, "\\\]");
    var regex = new RegExp("[\\?&#]" + name + "=([^&#]*)"),
        results = regex.exec(url);
    return results == null ? "" : decodeURIComponent(results[1].replace(/\+/g, " "));
}


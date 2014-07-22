/**
 * @author esh
 */

myExt.factory("backgroundServices",function($http,$q,$rootScope)
{
    function getAnnotation(currUrl)
    {
        var optReturnXMLData = arguments[1]; //if true, it will return xml Data else xmlString
        var optionalId = arguments[2];
        
        var deferred = $q.defer();
            var vId = getParameterByName("v",currUrl);
            var xmlUrl;
            // console.log(currUrl.match(/youtube.com/g));
            (currUrl.match(/youtube.com/g) == null)?(xmlUrl=currUrl):(xmlUrl='https://www.youtube.com/annotations_invideo');
            $http({method:'GET',
            url:xmlUrl,
            params:{features:1, legacy:1,video_id:vId},
            headers:{'Content-Type':'application/data','identifier':optionalId}
                }).success(function(data,status,headers,config)
                {
                    // remove InVideo Programming
                    data = data.replace(/<annotation [^>]*?id="channel:[\S\s]*?<\/annotation>/g, '');
                    // console.log(data);
                    if(optReturnXMLData==true)
                        data = textToXML(data);
                        
                    (optionalId !=null)?(deferred.resolve({"xml":data,"identifier":config.headers.identifier})):(deferred.resolve(data));
                    
                }).error(function(data,status,headers,config)
                {
                    console.log("error!");
                    (optionalId!=null)?(deferred.reject({"msg":"Error fetching annotations. Please reload","status":status,"identifier":config.headers.identifier})):(deferred.reject({"msg":"Error fetching annotations. Please reload","status":status},config.headers.identifier));
                });
            return deferred.promise;
    }
    
    return {
        getAnnotation:function(url)
        {
            return getAnnotation(url,arguments[1],arguments[2]);
        },
        hasAnnotation:function()
        {
            var deferred = $q.defer();
            
            chrome.tabs.getSelected(null, function(tab) {
                getAnnotation(tab.url).then(function(data,status)
                {
                    // console.log(data);
                    xml = textToXML(data);
                    try{
                            mainParent = xml.documentElement;
                            // console.log(mainParent.getElementsByTagName("annotations")[0].childNodes.length);
                            if(mainParent.getElementsByTagName("annotations")[0].childNodes.length == 0)
                                deferred.resolve(false);
                            else
                                deferred.resolve(true);
                    }
                    catch(err)
                    {
                        deferred.reject("");
                    }
                },function(reason)
                {
                    deferred.reject(reason);
                });
            });
            
            return deferred.promise;
            
        },
        sendXML:function(xml,mode)
        {
            var optId = arguments[2];
            var deferred = $q.defer();
            var xmlString = (new XMLSerializer()).serializeToString(xml);
            
            if(mode == "publish")
                var sendUrl = "https://www.youtube.com/annotations_auth/publish2"; 
            else
                var sendUrl = "https://www.youtube.com/annotations_auth/update2"; 
            
            $http({method: 'POST',
                url:sendUrl,
                data: xmlString,
                headers: {'Content-Type': '*/*','video':arguments[2],'mode':mode,'identifier':optId},
                withCredentials:true
                })
            .success(function(data,status,headers,config)
            {
                deferred.resolve({"msg":"Success","status":status,"mode":config.headers.mode,"video":config.headers.video,"data":config.data,"identifier":config.headers.identifier});    
            }).
            error(function(data,status,headers,config)
            {
                deferred.resolve({"msg":"Error Occured.","status":status,"mode":config.headers.mode,"video":config.headers.video,"data":config.data});
            });
            
            return deferred.promise;
        },
        loadTemplates:function()
        {
            // var buttonTypes
            var buttonTypes
            {
                //there must be actiontypes {url,time}
                //duration must be uneditable only if addable but it will still depend on action time so basically there's no editing of duration. :) 
                //
                
                
                //actiontype:time, addable:true means i can add more and the duration of annonations will be based on time
                //actiontype:url, addable:true will not allowed. but it can for video menu
                //actiontype:time, addable:false means highlights only
                //actiontype:url, addable:false
                
                //actiontype:channel
                
                //buttonType: videobar and menubar
                
            }
            
            // var xmlIds = [
                // {name:"Skip",ids:new Array('videobar_skip','videobar_skip_text'),"addable":true,"fixDuration":false,"fixAction":true},
                // {name:"Skip 1",ids:new Array('videobar_skip1','videobar_skip1_text'),"addable":false,"fixDuration":true,"fixAction":false}, //videobar_skip1 
                // {name:"Skip 2",ids:new Array('videobar_skip2','videobar_skip2_text'),"addable":false,"fixDuration":true,"fixAction":false}, //135 px tall
                // {name:"Skip 3",ids:new Array('videobar_skip3','videobar_skip3_text'),"addable":false,"fixDuration":true,"fixAction":false},
                // {name:"Star",ids:new Array('videobar_star','videobar_star_text'),"addable":false,"fixDuration":true,"fixAction":false},
                // {name:"Next",ids:new Array('videobar_next','videobar_next_text'),"addable":false,"fixDuration":true,"fixAction":false},
                // {name:"Hide",ids:new Array('videobar_hide','videobar_hide_text'),"addable":false,"fixDuration":true,"fixAction":false}
            // ];
            
            var xmlIds = [
                {name:"Skip ahead",ids:{"btn":"videobar_skip","text":"videobar_skip_text"},"addable":true,"actiontype":"time"},
                {name:"Skip to: 1",ids:{"btn":"videobar_skip1","text":"videobar_skip1_text"},"addable":false,"actiontype":"time"}, //videobar_skip1 
                {name:"Skip to: 2",ids:{"btn":"videobar_skip2","text":"videobar_skip2_text"},"addable":false,"actiontype":"time"}, //135 px tall
                {name:"Skip to: 3",ids:{"btn":"videobar_skip3","text":"videobar_skip3_text"},"addable":false,"actiontype":"time"},
                {name:"Star",ids:{"btn":"videobar_star","text":"videobar_star_text"},"addable":false,"actiontype":"url"},
                {name:"Next video",ids:{"btn":"videobar_next","text":"videobar_next_text"},"addable":false,"actiontype":"url"},
                {name:"Hide videobar",ids:{"btn":"videobar_hide","text":"videobar_hide_text"},"addable":false,"actiontype":"url"},
                {name:"Official channel",ids:{"btn":"videobar_channel","text":"videobar_channel_text"},"addable":false,"actiontype":"url","size":{"w":15.937,"h":17.514},"pos":{"x":84.063,"y":82.500}},
                {name:"Get this music!",ids:{"btn":"videobar_getmusic","text":"videobar_getmusic_text"},"addable":true,"actiontype":"url","size":{"w":30.38800,"h":51.15500},"pos":{"x":34.86500,"y":20.84500}}
            ];
            
            // var xmlIds2 = [
            // {name:"Hide",ids:new Array('videobar_hide','videobar_hide_text'),"addable":false},
                // {name:"Home",ids:new Array('videobar_home','videobar_home_text'),"addable":true}, //videobar_home videobar_home_text
                // {name:"Next",ids:new Array('videobar_next','videobar_next_text'),"addable":false},
                // {name:"Star",ids:new Array('videobar_star','videobar_star_text'),"addable":false},
                // {name:"Skip 1",ids:new Array('videobar_skip1','videobar_skip1_text'),"addable":false}, //videobar_skip1 
                // {name:"Skip 2",ids:new Array('videobar_skip2','videobar_skip2_text'),"addable":false}, //135 px tall
                // {name:"Skip 3",ids:new Array('videobar_skip3','videobar_skip3_text'),"addable":false},
//                 
                // {name:"Official Channel",ids:new Array('videobar_channel','videobar_channel_text'),"addable":false}
            // ];
//             
//             
            // var xmlIds3 = [
                // {name:"Home",ids:new Array('videobar_home','videobar_home_text'),"addable":true}, //videobar_home videobar_home_text
                // {name:"Next",ids:new Array('videobar_next','videobar_next_text'),"addable":false},
                // {name:"Star",ids:new Array('videobar_star','videobar_star_text'),"addable":false},
                // {name:"Skip",ids:new Array('videobar_skip','videobar_skip_text'),"addable":true},
                // {name:"Skip 1",ids:new Array('videobar_skip1','videobar_skip1_text'),"addable":false}, //videobar_skip1 
                // {name:"Skip 2",ids:new Array('videobar_skip2','videobar_skip2_text'),"addable":false}, //135 px tall
                // {name:"Skip 3",ids:new Array('videobar_skip3','videobar_skip3_text'),"addable":false},
                // {name:"Hide",ids:new Array('videobar_hide','videobar_hide_text'),"addable":false},
            // ];
            
            
            
            $rootScope.templates = [
                        // {id:"789789",name:"Videobar8.0",text:'This is awesome',image:'http://i1.ytimg.com/vi/wQQ7Ws222f8/mqdefault.jpg',"xml_ids":xmlIds2},
                        // {id:"1789789",name:"samefixed asdfasdfasdf asdfasdf",text:'This is just the same. This is just the same. This is just the same',url:'../templates/xml/vidBar2.xml',image:'http://i1.ytimg.com/vi/wQQ7Ws222f8/mqdefault.jpg',"xml_ids":xmlIds3},
                        {id:"eshleeromero",name:"Videobar 9.0",text:'Increase your watch time with any.TV videobars!&nbsp;See <a target="_blank" href="http://www.youtube.com/watch?v=tb45VON2Dxk">this video</a>',url:'../templates/videobar_9.0.xml',image:'images/vidbar.jpg',"xml_ids":xmlIds},
                        ];
                        
                        
            // var url = "http://www.videobar.tm/apis/get_templates.php";
            var url = "http://local.mya.tm/google_extension/videobarAPI/get_templates.php";
            $http({method:'GET',
            url:url,
            headers:{'Content-Type':'application/data'}
                }).success(function(data,status,headers,config)
                {
                    $rootScope.templates=data;
                    logConsole("Templates",$rootScope.templates);
                    
                }).error(function(data,status,headers,config)
                {
                    console.log("error!");
                });
            
        }
    }
});


function textToXML ( text ) {
      try {
        var xml = null;

        if ( window.DOMParser ) {

          var parser = new DOMParser();
          xml = parser.parseFromString( text, "text/xml" );

          var found = xml.getElementsByTagName( "parsererror" );

          if ( !found || !found.length || !found[ 0 ].childNodes.length ) {
            return xml;
          }

          return null;
        } else {

          xml = new ActiveXObject( "Microsoft.XMLDOM" );

          xml.async = false;
          xml.loadXML( text );

          return xml;
        }
      } catch ( e ) {
        // suppress
      }
}



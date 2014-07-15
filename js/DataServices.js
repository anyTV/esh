/**
 * @author esh
 */

myExt.factory("dataServices",function($http,$q,$rootScope)
{
    var connectLocal = true;

    var localURL = "http://local.mya.tm/google_extension/videobarAPI/";
    var liveURL = "http://www.videobar.tm/apis/";

    var defaultCollName = "DefaultSettings";
    var defaultFields = {
        "multiSelect":false
    }
    function collectionExists(collName)
    {
        var def = $q.defer();
        chrome.storage.sync.get(collName, function(data) 
        {
            console.log(data);
            console.log(collName+" Collection Exists = "+objHasProperties(data));
            $rootScope.$apply(function () {
            def.resolve(objHasProperties(data));
            });
        });
        return def.promise;
    }
    function getDefaulCollection()
    {
        var def = $q.defer();
        chrome.storage.sync.get(defaultCollName,function(data)
        {
            def.resolve(data);
        });
        return def.promise;
    }
    function createUserDefaultCollection(collName)
    {
        var def = $q.defer();
        collectionExists(collName).then(function(exist)
        {
            if(!exist)
            {
                getDefaulCollection().then(function(defaultCollection)
                {
                    var obj = new Object;
                    obj[collName] = {"settings":defaultCollection.DefaultSettings,"User since":new Date().toUTCString(),"logs":{}}; 
                     chrome.storage.sync.set(obj,function(data)
                    {
                        // def.resolve(true);
                        console.log("user collection successfully created");
                        def.resolve({"msg":"User Collection Successfully Created"});
                    });
                });
            } 
        });
        return def.promise;
    }
    function queryAllCollections()
    {
        var def = $q.defer();
        chrome.storage.sync.get(null,function(data)
        {
            console.log(data);
            def.resolve(data);
        });
        return def.promise;
    }
    function queryCollection(collName)
    {
        var def = $q.defer();
        chrome.storage.sync.get(collName,function(data)
        {
            console.log(data);
            $rootScope.$apply(function () {
                def.resolve(data);
            });
        });
        return def.promise; 
    }
    
    return {
        createDefaultCollections:function()
        {
            //"DefaultSettings" Collection
            var def = $q.defer();
            collectionExists("DefaultSettings").then(function(exist)
            {
                if(!exist)
                {
                    var obj = new Object;
                    obj[defaultCollName] = defaultFields
                    chrome.storage.sync.set(obj,function(data)
                    {
                        console.log("default collection successfully created");
                        def.resolve({"msg":"Default Collection Successfully Created"});
                    });
                }
            });
            return def.promise;
        },
        checkCollectionExists:function(collName)
        {
            return collectionExists(collName);
        },
        createUserDefaultCollection:function(collName)
        {
            return createUserDefaultCollection(collName);
        },
        insertLog:function(collName,newLog)
        {
            var def = $q.defer();
            // var logObject = new Object;
            // logObject[collName] = log; 
            
            queryCollection(collName).then(function(collData)
            {
                // def.resolve(collData);
                // 
                var arr = new Array;
                console.log(collData[collName].logs);
                angular.forEach(collData[collName].logs,function(oldLog)
                {
                    arr.push(oldLog);
                });
                
                arr.push(newLog);
                collData[collName].logs = arr;
                console.log(arr);
                console.log(collData[collName]);
                console.log(collData);
                chrome.storage.sync.set(collData,function(data)
                {
                    def.resolve(true);
                });
                
            });
            
            return def.promise;
        },
        queryAllCollections:function()
        {
            return queryAllCollections();
        },
        insertLog2:function(param)
        {
            var deferred = $q.defer();
            var optTemplate = arguments[1];

            if(connectLocal)
                (optTemplate)?(url = localURL+"video_templates.php"):(url = localURL+"video_copies.php");
            else
                (optTemplate)?(url = liveURL+"video_templates.php"):(url = liveURL+"video_copies.php");

            $http({method:'POST',
            url:url,
            data:param,
            headers:{'Content-Type':'application/data','Authorization':google.getAccessToken()}
                }).success(function(data,status,headers,config)
                {
                    // console.log(status);
                    // console.log(data);
                    $rootScope.dbLog = data;
                    deferred.resolve(data);
                    // $rootScope.alerts = []
                    // $rootScope.alerts = [{type:'info',msg:data}]
                    
                }).error(function(data,status,headers,config)
                {
                    console.log("error!");
                    deferred.reject({"msg":"Failed adding records to Database"});
                });
            return deferred.promise;
        },
        insertUser:function(param)
        {
            var deferred = $q.defer();
            if(connectLocal)
                var url = localURL+"users.php";
            else
                var url = liveURL+"users.php";
            if(param)
            {
                $http({method:'POST',
                url:url,
                data:param,
                headers:{'Content-Type':'application/data','Authorization':google.getAccessToken()}
                    }).success(function(data,status,headers,config)
                    {
                        deferred.resolve(data);
                        
                    }).error(function(data,status,headers,config)
                    {
                        console.log("Error Inserting to database!");
                        // $rootScope.hasAccessToken = false;
                        $rootScope.alerts_global = [{type:"error",msg:"Unauthorize access!"}];
                        // deferred.reject("Warning! ");
                    });
            }
            else
                deferred.reject("Please provide parameters");
                
            return deferred.promise;
        },
        getAnnotationTemplates:function(v,alt)
        {
            var deferred = $q.defer();
            if(connectLocal)
                var url = localURL+"video_templates.php";
            else
                var url = liveURL+"video_templates.php";
            if(v)
            {
                $http({method:'GET',
                url:url,
                params:{"v":v, "alt":alt, "app_id":chrome.runtime.id},
                headers:{'Content-Type':'application/data','identifier':arguments[2],'Authorization':google.getAccessToken()}
                    }).success(function(data,status,headers,config)
                    {
                        // logConsole("Template from DB",data);
                        deferred.resolve({"objects":data,"identifier":config.headers.identifier});
                        
                    }).error(function(data,status,headers,config)
                    {
                        $rootScope.alerts_global = [{type:"error",msg:"Error loading your settings!"}];
                        deferred.reject("Error occured!");
                    });
            }
            else
                deferred.reject("Please provide video id");
                
            return deferred.promise;
        },
        checkVideos:function(email)
        {
            var deferred = $q.defer();
            if(connectLocal)
                var url = localURL+"video_templates.php";
            else
                var url = liveURL+"video_templates.php";
            if(email)
            {
                $http({method:'GET',
                url:url,
                params:{"user_email":email, "app_id":chrome.runtime.id},
                headers:{'Content-Type':'application/data', 'Authorization':google.getAccessToken()}
                    }).success(function(data,status,headers,config)
                    {
                        logConsole("Checked videos",data);
                        if(data.length!=0)
                        {
                        }
                        deferred.resolve(data);
                        
                    }).error(function(data,status,headers,config)
                    {
                        console.log("Error checking if exist!");
                        deferred.reject("Error checking");
                    });
            }
            else
                deferred.reject("Please provide the email");
            return deferred.promise;
        },
        checkAnnotationTemplates:function(v)
        {

        },
        loadTemplates:function()
        {
            if(connectLocal)
                var url = localURL+"templates.php";
            else
                var url = liveURL+"templates.php";

            $http({method:'GET',
            url:url,
            headers:{'Content-Type':'application/data'}
                }).success(function(data,status,headers,config)
                {
                    $rootScope.templates=data;
                    logConsole("Templates",$rootScope.templates);
                    
                }).error(function(data,status,headers,config)
                {
                    console.log("Error loading templates!");
                });
        }
    }
});

function objHasProperties(obj) {
  for(var prop in obj) {
    if (obj.hasOwnProperty(prop)) {
      return true;
    }
  }
  return false;
}
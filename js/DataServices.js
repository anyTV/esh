/**
 * @author esh
 */

myExt.factory("dataServices",function($http,$q,$rootScope)
{
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
            $http({method:'POST',
            url:"http://local.mya.tm/google_extension/videobarAPI/insert_video_template.php",
            data:param,
            headers:{'Content-Type':'application/data'}
                }).success(function(data,status,headers,config)
                {
                    // console.log(status);
                    console.log(data);
                    
                }).error(function(data,status,headers,config)
                {
                    console.log("error!");
                });
                
        },
        checkUserExist:function(email)
        {
            var deferred = $q.defer();
            if(email)
            {
                $http({method:'GET',
                url:"http://local.mya.tm/google_extension/videobarAPI/getUser.php",
                params:{"user_email":email},
                headers:{'Content-Type':'application/data'}
                    }).success(function(data,status,headers,config)
                    {
                        console.log(data);
                        if(data.length!=0)
                            deferred.resolve(true);
                        else
                            deferred.resolve(false);
                        
                    }).error(function(data,status,headers,config)
                    {
                        console.log("Error checking if exist!");
                    });
            }
            else
                deferred.reject("Please provide the email");
            return deferred.promise;
        },
        insertUser:function(param)
        {
            var deferred = $q.defer();
            if(param)
            {
                $http({method:'POST',
                url:"http://local.mya.tm/google_extension/videobarAPI/insertUser.php",
                data:param,
                headers:{'Content-Type':'application/data'}
                    }).success(function(data,status,headers,config)
                    {
                        console.log(data);
                        deferred.resolve(data);
                        
                    }).error(function(data,status,headers,config)
                    {
                        console.log("Error Inserting to database!");
                    });
            }
            else
                deferred.reject("Please provide parameters");
                
            return deferred.promise;
            
        },
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
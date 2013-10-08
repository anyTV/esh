/**
 * @author esh@any.tv
 */

myExt.factory("mongoServices",function($http,$q,$rootScope)
{
    return{
        saveVideobar:function(params)
        {
            $http({method:'POST',
            url:"http://localhost/google_extension/videobarAPI/save_videobar.php",
            data:params,
            headers:{'Content-Type':'application/data'}
                }).success(function(data,status,headers,config)
                {
                    console.log(data);
                }).error(function(datas,status,headers,config)
                {
                    console.log("error!");
                });
        }
    }
});
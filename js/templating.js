/**
 * @author esh
 */

function templateController($rootScope,$scope,annotationsServices,dataServices)
{
    // $scope.templateOptions = "";

    $scope.testData = function(template)
    {
        var params = {"video_id":$rootScope.selected[0].id,
                        "user_email":$rootScope.userInfo.email,
                        "title":$rootScope.selected[0].name,
                        "template_id":template.id,
                        "template_buttons":template.buttons,
                        "xml_string":$rootScope.selected[0].xml,
                        "mode":"save"};
        // console.log(params);
        dataServices.insertLog2(params);
    }
    // $scope.getData = function(param)
    $scope.decodeURLToTime = function(url)
    {
        var time = getParameterByName("t",url);
        // console.log(url);
       
    }

    $scope.copyButtons = function(video)
    {
        video.buttons = $rootScope.selected[0].buttons;
    }

    
    $scope.useTemplate = function(template,index)
    {
        console.log(template);
        
        // if($rootScope.multiSelect == false || $rootScope.selected.length == 1 )
        // {
        //     $scope.multiMode = false;

            var i =0;

            if($rootScope.selected.length == 1)
                $scope.multiMode = false;
            else
                $scope.multiMode = true;
            angular.forEach($rootScope.selected,function(video)
            {
                annotationsServices.checkVideoTemplate(template,video,i).then(function(data)
                {
                    
                    console.log(data);
                    // if(data.objects.template_buttons)
                    // {
                    //     console.log("loading annotations from youtube");
                    //     // var result = annotationsServices.analyzeAnnotations(template.xml_ids,data.xml);
                    if(data['default'])
                    {
                        annotationsServices.checkOnYoutube(template,video,i).then(function(yt)
                        {
                            if(yt.templateUsed)
                            {
                                annotationsServices.analyzeAnnotations(template.xml_ids,yt.xml);
                            }
                            else
                            {
                                
                            }
                        });
                    }
                    else
                    {
                        $rootScope.templates[index].buttons = data.objects;
                        $rootScope.selected[data.identifier].buttons = data.objects;
                        $rootScope.selected[data.identifier].template_id = data.template_id;
                    }
                          
                    // }
                    // else
                    // {
                    //     var result = annotationsServices.analyzeIds(template.xml_ids,video,i);
                    //     console.log(arguments);
                    //     $rootScope.templates[index].buttons = result.objects;
                    //     $rootScope.selected[result.identifier].buttons = result.objects;
                    // }
                        
                        angular.forEach($rootScope.templates[index].buttons,function(button)
                        {
                            if(button.actiontype == "url" && button.addable == true)
                            {
                                button.allowEditDuration = true;
                            }
                        });
                     
                });
                i++;            
            });

        // }
        // else
        // {
        //     $scope.multiMode = true;
           

        // }

    }
    
    $scope.saveItem = function(video,btnIndex,button)
    {
        console.log(button);
        var newText = video.newText,newStart = video.newStart,newStop = video.newStop,newAction = video.newAction;
        
        var duration = {"start":newStart,"stop":newStop};
        var length = button.instances.length
        var base = button.instances
        console.log(base[0]);
        // base[0].action.childNodes[0].attributes[1].value = newAction;
        button.instances.push({"id":annotationsServices.getIdPrefix()+base[0].id+"_"+(length+1),"action":newAction,"text":newText,"textId":annotationsServices.getIdPrefix()+base[0].textId+"_"+(length+1),"duration":duration,"editable":true});
        button.edited = true;
        video.newText = "",video.newStart = "",video.newStop = "",video.newAction = "";video.addMode = false;
    }
    
    $scope.deleteItem = function(id,buttons)
    {
        console.log(id);
        console.log(buttons);
        buttons.instances.splice(id,1);
    }
    
    $scope.editItem = function(instance,button)
    {
        console.log(instance);
        console.log(button);
        button.edited = true;
    }
}




Array.prototype.remove = function(from, to) {
  var rest = this.slice((to || from) + 1 || this.length);
  this.length = from < 0 ? this.length + from : from;
  return this.push.apply(this, rest);
};

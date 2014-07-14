/**
 * @author esh
 */

function templateController($rootScope,$scope,annotationsServices,dataServices)
{
    
    $scope.decodeURLToTime = function(url)
    {
        var time = getParameterByName("t",url);
    }

    $scope.copyButtons = function(video)
    {
        video.buttons = angular.copy($rootScope.selected[0].buttons);
        video.buttons["fontColor"] = angular.copy($rootScope.selected[0].buttons.fontColor);
        console.log(video.buttons);
    }
    $scope.rearrangeOrder = function(index)
    {
        console.log(index);
        $rootScope.selected.swapItems(0,index);
    }

    
    $scope.useTemplate = function(template,index)
    {
        $rootScope.alerts_global = [{type:'info',msg:'Loading your settings...'}];
        logConsole("Template Used",template);
        
        // if($rootScope.multiSelect == false || $rootScope.selected.length == 1 )
        // {
        //     $scope.multiMode = false;

            var i =0;

            if($rootScope.selected.length == 1)
                $scope.multiMode = false;
            else
                $scope.multiMode = true;

            var result = [];
            angular.forEach($rootScope.selected,function(video)
            {
                annotationsServices.checkVideoTemplate(template,video,i).then(function(data)
                {
                    result[i] = "";
                    // if(data.objects.template_buttons)
                    // {
                    //     console.log("loading annotations from youtube");
                    //     // var result = annotationsServices.analyzeAnnotations(template.xml_ids,data.xml);
                    if(data['default'])
                    {
                        annotationsServices.checkOnYoutube(template,video,data.identifier).then(function(yt)
                        {
                            result[yt.identifier] = yt;
                            console.log(result[yt.identifier]);
                            if(result[yt.identifier].templateUsed)
                            {
                                result[yt.identifier] = annotationsServices.analyzeAnnotations(template.xml_ids,yt.xml);
                                $rootScope.selected[yt.identifier].buttons = result[yt.identifier].objects;
                                $rootScope.selected[yt.identifier].template_id = template.id;
                                angular.forEach($rootScope.selected[yt.identifier].buttons,function(button)
                                {
                                    if(button.actiontype == "url" && button.addable == true)
                                    {
                                        button.allowEditDuration = true;
                                    }
                                });
                            }
                            else
                            {
                                console.log($rootScope.selected[yt.identifier]);
                                $rootScope.selected[yt.identifier].buttons = annotationsServices.analyzeIds(template.xml_ids,video,i).objects;
                                $rootScope.selected[yt.identifier].template_id = template.id;
                                angular.forEach($rootScope.selected[yt.identifier].buttons,function(button)
                                {
                                    if(button.actiontype == "url" && button.addable == true)
                                    {
                                        button.allowEditDuration = true;
                                    }
                                });
                            }
                        });
                    }
                    else
                    {
                        $rootScope.templates[index].buttons = data.objects;
                        $rootScope.selected[data.identifier].buttons = data.objects;
                        $rootScope.selected[data.identifier].template_id = data.template_id;
                        angular.forEach($rootScope.selected[data.identifier].buttons,function(button)
                        {
                            if(button.actiontype == "url" && button.addable == true)
                            {
                                button.allowEditDuration = true;
                            }
                        });
                    }
                          
                    // }
                    // else
                    // {
                    //     var result = annotationsServices.analyzeIds(template.xml_ids,video,i);
                    //     console.log(arguments);
                    //     $rootScope.templates[index].buttons = result.objects;
                    //     $rootScope.selected[result.identifier].buttons = result.objects;
                    // }
                        
                     $rootScope.alerts_global = [];
                    // video.buttons = {fontColor:"White"};
                },function(reason)
                {
                    $rootScope.templates.isCollapsed = true;
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
        var newText = video.newText,newStart = video.newStart,newStop = video.newStop,newAction = video.newAction;
        
        var duration = {"start":newStart,"stop":newStop};
        var length = button.instances.length;
        var base = button.instances;
        // base[0].action.childNodes[0].attributes[1].value = newAction;
        button.instances.push({"id":annotationsServices.getIdPrefix()+base[0].id+"_"+(length),"action":newAction,"text":newText,"textId":annotationsServices.getIdPrefix()+base[0].textId+"_"+(length),"duration":duration,"editable":true});
        button.edited = true;
        video.newText = "",video.newStart = "",video.newStop = "",video.newAction = "";video.addMode = false;
        console.log(button);
    }
    
    $scope.deleteItem = function(id,button)
    {
        button.instances.splice(id,1);
        var base = button.instances[0];
        var i=0;
        angular.forEach(button.instances,function(instance)
        {
            if(i!=0)
            {
                instance.id = annotationsServices.getIdPrefix() + base.id+"_"+i;
                instance.textId = annotationsServices.getIdPrefix() + base.textId+"_"+i;
            }
            i++;
        });
        console.log(button);
    }
    
    $scope.editItem = function(instance,button)
    {
        button.edited = true;
    }

    $scope.toggle = function(templates,template,index)
    {
        $rootScope.alerts = [];
        if(templates.isCollapsed)
        {
            templates.isCollapsed = false;
            $scope.useTemplate(template,index);
        }
        else
        {
            templates.isCollapsed = true;
            $scope.pane = [];
            angular.forEach($scope.selected,function(video)
            {
                video.buttons = [];
            });

            angular.forEach($scope.templates,function(template)
            {
                template.buttons = [];
            });
        }
    }
}




Array.prototype.remove = function(from, to) {
  var rest = this.slice((to || from) + 1 || this.length);
  this.length = from < 0 ? this.length + from : from;
  return this.push.apply(this, rest);
};

Array.prototype.swapItems = function(a, b){
    this[a] = this.splice(b, 1, this[a])[0];
    return this;
}
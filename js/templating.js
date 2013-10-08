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
    
    $scope.useTemplate = function(template,index)
    {
        console.log(template);
        
        if($rootScope.multiSelect == false || $rootScope.selected.length == 1 )
        {
            $scope.multiMode = false;
            annotationsServices.checkVideoTemplate(template.xml_ids,$rootScope.selected[0]).then(function(data)
            {
                if(data.templateUsed)
                {
                    console.log("loading annotations from youtube");
                    var result = annotationsServices.analyzeAnnotations(template.xml_ids,data.xml);
                }
                else
                {
                    var result = annotationsServices.analyzeIds(template.url,template.xml_ids,$rootScope.selected[0]);
                    console.log(arguments);
                }
                
                $rootScope.templates[index].buttons = result.objects;
                    
                    angular.forEach($rootScope.templates[index].buttons,function(button)
                    {
                        if(button.actiontype == "url" && button.addable == true)
                        {
                            button.allowEditDuration = true;
                        }
                    })
                    console.log($rootScope.templates);
            });
        }
        else
        {
            $scope.multiMode = true;
        }
        
        
        
        
            
    }
    
    $scope.saveItem = function(templateIndex,btnIndex,button)
    {
        console.log(button);
        var newText = $scope.templates.newText,newStart = $scope.templates.newStart,newStop = $scope.templates.newStop,newAction = $scope.templates.newAction;
        
        var duration = {"start":newStart,"stop":newStop};
        var length = button.instances.length
        var base = button.instances
        console.log(base[0]);
        // base[0].action.childNodes[0].attributes[1].value = newAction;
        button.instances.push({"id":annotationsServices.getIdPrefix()+base[0].id+"_"+(length+1),"action":newAction,"text":newText,"textId":annotationsServices.getIdPrefix()+base[0].textId+"_"+(length+1),"duration":duration,"editable":true});
        button.edited = true;
        $scope.templates.newText = "",$scope.templates.newStart = "",$scope.templates.newStop = "",$scope.templates.newAction = "";$scope.templates.addMode = false;
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

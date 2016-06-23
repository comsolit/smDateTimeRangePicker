(function(){

'use strict';

function Calender($timeout,picker){
	return {
	  restrict : 'E',
	  replace:true,
      require: ['^ngModel', 'smCalender'],
      scope :{
	      	minDate: "=",
	      	maxDate: "=",
	      	initialDate : "=",
	      	format:"@",
	      	mode:"@",
	      	startView:"@",	      	
	      	weekStartDay:"@",
	      	dateSelectCall : '&'
	    },
	   	controller:["$scope","$timeout","picker","$mdMedia",CalenderCtrl],
	    controllerAs : 'vm',
	    templateUrl:"picker/calender-date.html",
		link : function(scope,element,attr,ctrls){
			var ngModelCtrl = ctrls[0];
	        var calCtrl = ctrls[1];
	        calCtrl.configureNgModel(ngModelCtrl);
		}      
	}
}

var CalenderCtrl = function($scope,$timeout,picker,$mdMedia){
	var self  = this;

	self.$scope = $scope;
	self.$timeout = $timeout;
    self.picker = picker;
    self.dayHeader = self.picker.dayHeader;
	self.initialDate = $scope.initialDate; 	
    self.viewModeSmall = $mdMedia('xs');
	self.startDay = angular.isUndefined($scope.weekStartDay) || $scope.weekStartDay==='' ? 'Sunday' : $scope.weekStartDay ;	   	
	self.minDate = $scope.minDate;			//Minimum date 
	self.maxDate = $scope.maxDate;			//Maximum date 
	self.mode = angular.isUndefined($scope.mode) ? 'DATE' : $scope.mode;
	self.format = $scope.format;
	self.restrictToMinDate = angular.isUndefined($scope.minDate) ? false : true;
	self.restrictToMaxDate = angular.isUndefined($scope.maxDate) ? false : true;
	self.stopScrollPrevious =false;
	self.stopScrollNext = false;
	self.monthCells=[];
	self.dateCellHeader= [];	
	self.dateCells = [];
	self.monthList = picker.monthNames;
	self.moveCalenderAnimation='';

	self.format = angular.isUndefined(self.format) ? 'MM-DD-YYYY': self.format;
	self.initialDate =	angular.isUndefined(self.initialDate) ? moment() : moment(self.initialDate,self.format);
	
	self.currentDate = self.initialDate.clone();

	if(self.restrictToMinDate) 
		self.minDate = moment(self.minDate, self.format);
	if(self.restrictToMaxDate) 
		self.maxDate = moment(self.maxDate, self.format);
    self.yearItems = {
        currentIndex_: 0,
        PAGE_SIZE: 7,
        START: 1900,
        getItemAtIndex: function(index) {
            if(this.currentIndex_ < index)
                this.currentIndex_ = index;
            return this.START + index;
        },
        getLength: function() {
            return this.currentIndex_ + Math.floor(this.PAGE_SIZE / 2);
        }
    };	
	self.init();
}

CalenderCtrl.prototype.setInitDate = function(dt) {
    var self = this;
    console.log(dt);
    self.initialDate =angular.isUndefined( dt) ? moment() : moment( dt,self.format);
  };


CalenderCtrl.prototype.configureNgModel = function(ngModelCtrl) {
    var self = this;

    self.ngModelCtrl = ngModelCtrl;

    ngModelCtrl.$render = function() {
      self.ngModelCtrl.$viewValue= self.currentDate;
    };

  };


  CalenderCtrl.prototype.setNgModelValue = function(date) {
  	var self = this;
    self.ngModelCtrl.$setViewValue(date);
    self.ngModelCtrl.$render();
  };

CalenderCtrl.prototype.init = function(){
	var self = this;
	self.buildDateCells();
	self.buildDateCellHeader();
	self.buildMonthCells();
	self.setView()
    self.showYear();


};

CalenderCtrl.prototype.setView = function(){
	var self = this;
	self.headerDispalyFormat = "ddd, MMM DD";	
	switch(self.mode) {
	    case 'date-time':
			self.view = 'DATE'
			self.headerDispalyFormat = "ddd, MMM DD HH:mm";			
	        break;
	    case 'time':
	        self.view = 'HOUR';
			self.headerDispalyFormat = "HH:mm";
	        break;
	    default:
	        self.view = 'DATE';
	}	
}


CalenderCtrl.prototype.showYear = function() { 
	var self = this;
    self.yearTopIndex = (self.initialDate.year() - self.yearItems.START) + Math.floor(self.yearItems.PAGE_SIZE / 2);
    self.yearItems.currentIndex_ = (self.initialDate.year() - self.yearItems.START) + 1;
};


CalenderCtrl.prototype.buildMonthCells = function(){
	var self = this;
	self.monthCells = moment.months();
};

CalenderCtrl.prototype.buildDateCells = function(){
	var self = this;
	var currentMonth = self.initialDate.month();
    var calStartDate  = self.initialDate.clone().date(0).day(self.startDay);
    var weekend = false;
    var isDisabledDate =false;


    /*
    	Check if min date is greater than first date of month
    	if true than set stopScrollPrevious=true 
    */
	if(!angular.isUndefined(self.minDate)){	
		self.stopScrollPrevious	 = self.minDate.unix() > calStartDate.unix();
	}

    self.dateCells =[];
	for (var i = 0; i < 6; i++) {
		var week = [];
		for (var j = 0; j < 7; j++) {
			
			var isCurrentMonth = (calStartDate.month()=== currentMonth);	
			

			if(isCurrentMonth){isDisabledDate=false}else{isDisabledDate=true};
			

			if(self.restrictToMinDate && !angular.isUndefined(self.minDate) && !isDisabledDate)
				isDisabledDate = self.minDate.isAfter(calStartDate);
			
			if(self.restrictToMaxDate && !angular.isUndefined(self.maxDate) && !isDisabledDate)
				isDisabledDate = self.maxDate.isBefore(calStartDate);
			

			var  day = {
	            	date : calStartDate.clone(),
	                dayNum: isCurrentMonth ? calStartDate.date() :"",
	                month : calStartDate.month(),
	                today: calStartDate.isSame(moment(),'day') && calStartDate.isSame(moment(),'month'),
	                year : calStartDate.year(),
	                dayName : calStartDate.format('dddd'),
	                isWeekEnd : weekend,
	                isDisabledDate : isDisabledDate,
	                isCurrentMonth : isCurrentMonth
			};
			
			week.push(day);
            calStartDate.add(1,'d')
		}
		self.dateCells.push(week);
	}
    /*
    	Check if max date is greater than first date of month
    	if true than set stopScrollPrevious=true 
    */
	if(self.restrictToMaxDate && !angular.isUndefined(self.maxDate)){	
		self.stopScrollNext	= self.maxDate.unix() < calStartDate.unix();
	}

	if(self.dateCells[0][6].isDisabledDate && !self.dateCells[0][6].isCurrentMonth){
		self.dateCells[0].splice(0);
	}

};

CalenderCtrl.prototype.changePeriod = function(c){
	var self = this;
	if(c === 'p'){
		if(self.stopScrollPrevious) return;
		self.moveCalenderAnimation='slideLeft';
		self.initialDate.subtract(1,'M');
	}else{
		if(self.stopScrollNext) return;
		self.moveCalenderAnimation='slideRight';
		self.initialDate.add(1,'M');
	}

	self.buildDateCells();
	self.$timeout(function(){
		self.moveCalenderAnimation='';
	},500);
};


CalenderCtrl.prototype.selectDate = function(d,isDisabled){
	var self = this;
	if (isDisabled) return;
	self.currentDate = d;
	self.$scope.dateSelectCall({date:d});
	self.setNgModelValue(d);

	self.$scope.$emit('calender:date-selected');

}


CalenderCtrl.prototype.buildDateCellHeader = function(startFrom){
	var self = this;
	var daysByName = self.picker.daysNames;
	
	var keys = [];
	for (var key in daysByName) {
		keys.push(key)
	}
	var startIndex = moment().day(self.startDay).day(), count = 0;
	for (var key in daysByName) {

    	self.dateCellHeader.push(daysByName[ keys[ (count + startIndex) % (keys.length)] ]);
        count++; // Don't forget to increase count.
    }  
}
/*
	Month Picker
*/

CalenderCtrl.prototype.changeView = function(view){
	var self = this;
	self.view =view;
    if(self.view==='YEAR_MONTH'){
        self.showYear();
    }
}

/*
	Year Picker
*/


CalenderCtrl.prototype.changeYear = function(yr){
	var self = this;
	self.initialDate.year(yr);
	self.buildDateCells();
	self.view='DATE';	
}

/*
	Hour and Time
*/


CalenderCtrl.prototype.setHour = function(h){
	var self = this;
	self.currentDate.hour(h);
}

CalenderCtrl.prototype.setMinute = function(m){
	var self = this;
	self.currentDate.minute(m);
}

CalenderCtrl.prototype.selectedDateTime = function(){
	var self = this;
	self.setNgModelValue(self.currentDate);
	if(self.mode === 'time') 
		self.view='HOUR' 
	else 
		self.view='DATE';
	self.$scope.$emit('calender:close');			
}

CalenderCtrl.prototype.closeDateTime = function(){
	var self = this;
	if(self.mode === 'time') 
		self.view='HOUR' 
	else 
		self.view='DATE';
	self.$scope.$emit('calender:close');
}




function picker() {
  var massagePath = "X";
  var cancelLabel = "Cancel";
  var okLabel = "Ok";
  var customHeader = {
    date:'ddd, MMM DD',
    dateTime:'ddd, MMM DD HH:mm',
    time:'HH:mm'
  };

  //date picker configuration
  var daysNames = [
    {'single':'S','shortName':'Su','fullName':'Sunday'},
    {'single':'M','shortName':'Mo','fullName':'MonDay'},
    {'single':'T','shortName':'Tu','fullName':'TuesDay'},
    {'single':'W','shortName':'We','fullName':'Wednesday'},
    {'single':'T','shortName':'Th','fullName':'Thursday'},
    {'single':'F','shortName':'Fr','fullName':'Friday'},
    {'single':'S','shortName':'Sa','fullName':'Saturday'}
  ];

  var dayHeader = "single";

  var monthNames = moment.months();

  //range picker configuration
  var rangeDivider = "To";

  var rangeSelectOptions = [
    {range: 'today', label: 'Today'},
    {range: 'past_week', label: 'Past Week'},
    {range: 'past_month', label: 'Past Month'},
    {range: 'this_month', label: 'This Month' },
    {range: 'previous_month', label: 'Previous Month'},
    {range: 'this_quarter', label: 'This Quarter'},
    {range: 'this_year', label: 'This Year'},
    {range: 'year_to_date', label: 'Year To Date'},
    {range: 'custom_range', label: 'Custom Range'}
  ];

  var rangeCustomStartEnd = ['Start Date','End Date'];

  return{
    setMassagePath : function(param){
      massagePath = param;
    },
    setDivider : function(value){
      divider = value
    },
    setDaysNames : function(array){
      daysNames =array;
    },
    setMonthNames : function(array){
      monthNames = array;
    },
    setDayHeader : function(param){
      dayHeader = param;
    },
    setOkLabel : function(param){
      okLabel = param;
    },
    setCancelLabel : function(param){
      cancelLabel = param;
    },
    setRangeSelectOptions: function (array) {
      rangeSelectOptions = array;
    },
    setRangeCustomStartEnd : function(array){
      rangeCustomStartEnd = array;
    },
    setCustomHeader : function(obj){
      if(!angular.isUndefined(obj.date)){
        customHeader.date= obj.date;
      }
      if(!angular.isUndefined(obj.dateTime)){
        customHeader.dateTime= obj.dateTime;
      }
      if(!angular.isUndefined(obj.time)){
        customHeader.time= obj.time;
      }
    },
    $get: function(){
      return {
        massagePath : massagePath,
        cancelLabel: cancelLabel,
        okLabel : okLabel,

        daysNames : daysNames,
        monthNames:monthNames,
        dayHeader :dayHeader,
        customHeader:customHeader,

        rangeDivider : rangeDivider,
        rangeCustomStartEnd : rangeCustomStartEnd,
        rangeSelectOptions: rangeSelectOptions
      }
    }
  }
}

var app = angular.module('smDateTimeRangePicker',[]);

app.directive('smCalender',['$timeout','picker',Calender]);
app.provider('picker',[picker]);

})();
(function(){

'use strict';

function TimePicker(){
	return {
	  restrict : 'E',
	  replace:true,
      require: ['^ngModel', 'smTime'],
      scope :{
	      	initialTime : "@",
	      	format:"@",
	      	timeSelectCall : '&'	      	
	    },
	   	controller:["$scope","$timeout",TimePickerCtrl],
	    controllerAs : 'vm',
	    templateUrl:"picker/calender-hour.html",
		link : function(scope,element,att,ctrls){
			var ngModelCtrl = ctrls[0];
	        var calCtrl = ctrls[1];
	        calCtrl.configureNgModel(ngModelCtrl);

		}      
	}
}

var TimePickerCtrl = function($scope,$timeout){
	var self  = this;
	self.uid = Math.random().toString(36).substr(2,5);
	self.$scope = $scope;
	self.$timeout = $timeout;
	self.initialDate = $scope.initialTime; 	//if calender to be  initiated with specific date 
	self.format = $scope.format;
	self.hourItems =[];
	self.minuteCells =[];
	self.format = angular.isUndefined(self.format) ? 'HH:mm': self.format;
	self.initialDate =	angular.isUndefined(self.initialDate)? moment() : moment(self.initialDate,self.format);
	self.currentDate = self.initialDate.clone();
	self.hourSet =false;
	self.minuteSet = false;

	self.show=true;
	self.init();
}

TimePickerCtrl.prototype.init = function(){
	var self = this;
	self.buidHourCells();
	self.buidMinuteCells();
	self.headerDispalyFormat = "HH:mm";
	self.showHour();
};

TimePickerCtrl.prototype.showHour = function() { 
	var self = this;

	self.hourTopIndex = 22;
	self.minuteTopIndex	= (self.initialDate.minute() -0) + Math.floor(7 / 2);	
    //self.yearTopIndex = (self.initialDate.year() - self.yearItems.START) + Math.floor(self.yearItems.PAGE_SIZE / 2);	
//	self.hourItems.currentIndex_ = (self.initialDate.hour() - self.hourItems.START) + 1;
};





 TimePickerCtrl.prototype.configureNgModel = function(ngModelCtrl) {
    this.ngModelCtrl = ngModelCtrl;
    var self = this;
    ngModelCtrl.$render = function() {
      self.ngModelCtrl.$viewValue= self.currentDate;
    };
  };


  TimePickerCtrl.prototype.setNgModelValue = function(date) {
  	var self = this;
    self.ngModelCtrl.$setViewValue(date);
    self.ngModelCtrl.$render();
  };




TimePickerCtrl.prototype.buidHourCells = function(){
	var self = this;

	for (var i = 0 ; i <= 23; i++) {
		var hour={
			hour : i,
			isCurrent :(self.initialDate.hour())=== i 
		}
		self.hourItems.push(hour);
	};	
};

TimePickerCtrl.prototype.buidMinuteCells = function(){
	var self = this;
	self.minuteTopIndex	= self.initialDate.minute();
	for (var i = 0 ; i <= 59; i++) {
		var minute = {
			minute : i,
			isCurrent : (self.initialDate.minute())=== i,
		}
		self.minuteCells.push(minute);
	};
};


TimePickerCtrl.prototype.selectDate = function(d,isDisabled){
	var self = this;
	if (isDisabled) return;
	self.currentDate = d;

	self.$scope.$emit('calender:date-selected');

}


TimePickerCtrl.prototype.setHour = function(h){
	var self = this;
	self.currentDate.hour(h);
	self.setNgModelValue(self.currentDate);
	self.hourSet =true;
	if(self.hourSet && self.minuteSet){
		self.$scope.timeSelectCall({time: self.currentDate});
		self.hourSet=false; 
		self.minuteSet=false;
	}	
}

TimePickerCtrl.prototype.setMinute = function(m){
	var self = this;
	self.currentDate.minute(m);
	self.setNgModelValue(self.currentDate);		
	self.minuteSet =true;	
	if(self.hourSet && self.minuteSet){
		self.$scope.timeSelectCall({time: self.currentDate});
		self.hourSet=false; 
		self.minuteSet=false;		
	}	

}

TimePickerCtrl.prototype.selectedDateTime = function(){
	var self = this;
	self.setNgModelValue(self.currentDate);
	if(self.mode === 'time') 
		self.view='HOUR' 
	else 
		self.view='DATE';
	self.$scope.$emit('calender:close');			
}

var app = angular.module('smDateTimeRangePicker');

app.directive('smTime',['$timeout',TimePicker]);


})();

(function(){

'use strict';

function DatePickerDir($timeout,picker,$mdMedia,$window){
	return {
	  restrict : 'E',
      require: '^ngModel',
      replace:true,
      scope :{
	      	initialDate : "=",
	      	minDate	:"=",
	      	maxDate:"=",
	      	format:"@",
	      	mode:"@",	      	
	      	startDay:"@",
	      	closeOnSelect:"@",
	      	weekStartDay:"@"
	    },
	    templateUrl:"picker/date-picker.html",
		link : function(scope,element,att,ngModelCtrl){
			setViewMode(scope.mode);
			scope.okLabel = picker.okLabel;
			scope.cancelLabel = picker.cancelLabel;			

			scope.$mdMedia =$mdMedia;
			scope.currentDate = isNaN(ngModelCtrl.$viewValue)  ? moment(): ngModelCtrl.$viewValue ;
			 
			function setViewMode(mode){
				switch(mode) {
				    case 'date':
				        scope.view = 'DATE';
						scope.headerDispalyFormat = picker.customHeader.date;				        
				        break;
				    case 'date-time':
						scope.view = 'DATE'
						scope.headerDispalyFormat =  picker.customHeader.dateTime;			
				        break;
				    case 'time':
				        scope.view = 'HOUR';
						scope.headerDispalyFormat = "HH:mm";
				        break;
				    default:
						scope.headerDispalyFormat = "ddd, MMM DD ";
				        scope.view = 'DATE';
				}					
			}

			scope.$on('calender:date-selected',function(){
				if(scope.closeOnSelect && (scope.mode!=='date-time' || scope.mode!=='time')){
					var date = moment(scope.selectedDate,scope.format);
					if(!date.isValid()){
						date = moment();
						scope.selectedDate =date;
					}
					if(!angular.isUndefined(scope.selectedTime)){	
						date.hour(scope.selectedTime.hour()).minute(scope.selectedTime.minute());
					}
					scope.currentDate =scope.selectedDate;
					ngModelCtrl.$setViewValue(date.format(scope.format));
					ngModelCtrl.$render();
					setViewMode(scope.mode)
					scope.$emit('calender:close');			

				}
			})

			scope.selectedDateTime = function(){
				var date = moment(scope.selectedDate,scope.format);
				if(!date.isValid()){
					date = moment();
					scope.selectedDate =date;
				}
				if(!angular.isUndefined(scope.selectedTime)){
					date.hour(scope.selectedTime.hour()).minute(scope.selectedTime.minute());
				}
				scope.currentDate =scope.selectedDate;
				ngModelCtrl.$setViewValue(date.format(scope.format));
				ngModelCtrl.$render();
				setViewMode(scope.mode)
				scope.$emit('calender:close');			
			}


			scope.closeDateTime = function(){
				scope.$emit('calender:close');			
			}

		}      
	}
}

function TimePickerDir($timeout,picker,$mdMedia,$window){
	return {
	  restrict : 'E',
      require: '^ngModel',
      replace:true,
      scope :{
	    initialDate : "@",
	    format:"@",
	    mode:"@",	      	
	    closeOnSelect:"@"
	},
	templateUrl:"picker/time-picker.html",
	link : function(scope,element,att,ngModelCtrl){
			setViewMode(scope.mode)
		    
		    scope.okLabel = picker.okLabel;
		    scope.cancelLabel = picker.cancelLabel;

			scope.currentDate = isNaN(ngModelCtrl.$viewValue)  ? moment(): ngModelCtrl.$viewValue ;
			scope.$mdMedia =$mdMedia;
			function setViewMode(mode){
				switch(mode) {
				    case 'date-time':
						scope.view = 'DATE'
						scope.headerDispalyFormat = "ddd, MMM DD HH:mm";			
				        break;
				    case 'time':
				        scope.view = 'HOUR';
						scope.headerDispalyFormat = "HH:mm";
				        break;
				    default:
				        scope.view = 'DATE';
				}					
			}

			scope.$on('calender:date-selected',function(){
				if(scope.closeOnSelect && (scope.mode!=='date-time' || scope.mode!=='time')){
					var date = moment(scope.selectedDate,scope.format);
					if(!date.isValid()){
						date = moment();
						scope.selectedDate =date;
					}
					if(!angular.isUndefined(scope.selectedTime)){	
						date.hour(scope.selectedTime.hour()).minute(scope.selectedTime.minute());
					}
					scope.currentDate =scope.selectedDate;
					ngModelCtrl.$setViewValue(date.format(scope.format));
					ngModelCtrl.$render();
					setViewMode(scope.mode)
					scope.$emit('calender:close');			

				}
			})

			scope.selectedDateTime = function(){
				var date = moment(scope.selectedDate,scope.format);
				if(!date.isValid()){
					date = moment();
					scope.selectedDate =date;
				}
				if(!angular.isUndefined(scope.selectedTime)){	
					date.hour(scope.selectedTime.hour()).minute(scope.selectedTime.minute());
				}
				scope.currentDate =scope.selectedDate;
				ngModelCtrl.$setViewValue(date.format(scope.format));
				ngModelCtrl.$render();
				setViewMode(scope.mode)
				scope.$emit('calender:close');			
			}


			scope.closeDateTime = function(){
				scope.$emit('calender:close');			
			}

		}      
	}
}


var app = angular.module('smDateTimeRangePicker');

app.directive('smDatePicker',['$timeout','picker','$mdMedia','$window',DatePickerDir]);
app.directive('smTimePicker',['$timeout','picker','$mdMedia','$window',TimePickerDir]);


})();



(function(){

'use strict';

var app = angular.module('smDateTimeRangePicker');


function DatePickerServiceCtrl($scope, $mdDialog, $mdMedia, $timeout,$mdUtil,picker){
    var self = this;

    if(!angular.isUndefined(self.options) && (angular.isObject(self.options))){
        self.mode = isExist(self.options.mode,self.mode); 
        self.format = isExist(self.options.format,'MM-DD-YYYY');
        self.minDate = isExist(self.options.minDate,undefined);
        self.maxDate = isExist(self.options.maxDate,undefined);
        self.weekStartDay = isExist(self.options.weekStartDay,'Sunday');
        self.closeOnSelect =isExist(self.options.closeOnSelect,false);
    }

    console.log(self.format);
    if(!angular.isObject(self.initialDate)){
        self.initialDate = moment(self.initialDate,self.format);
        self.selectedDate = self.initialDate;                  
    }

    self.currentDate = self.initialDate;
    self.viewDate = self.currentDate;

    self.view = 'DATE';
    self.$mdMedia = $mdMedia;
    self.$mdUtil = $mdUtil;

    self.okLabel = picker.okLabel;
    self.cancelLabel = picker.cancelLabel;         



    setViewMode(self.mode);

    function isExist(val,def){
        return angular.isUndefined(val)? def:val;
    }


    function setViewMode(mode){
        switch(mode) {
            case 'date':
                self.headerDispalyFormat = "ddd, MMM DD ";                     
            break;
            case 'date-time':
                self.headerDispalyFormat = "ddd, MMM DD HH:mm";            
            break;
            case 'time':
                self.headerDispalyFormat = "HH:mm";
            break;
            default:
                self.headerDispalyFormat = "ddd, MMM DD ";
        }                   
    }

    self.autoClosePicker = function(){
        if(self.closeOnSelect){        
            if(angular.isUndefined(self.selectedDate)){
              self.selectedDate = self.initialDate;
            }
            //removeMask();            
            $mdDialog.hide(self.selectedDate.format(self.format));
        }    
    }

    self.dateSelected = function(date){
        self.selectedDate = date;
        self.viewDate = date;
        if(self.mode==='date-time')  
            self.view = 'HOUR';
        else
            self.autoClosePicker();
    }

    self.timeSelected = function(time){
        self.selectedDate.hour(time.hour()).minute(time.minute());        
        self.viewDate = self.selectedDate;
        self.autoClosePicker();                
    }    

    self.closeDateTime = function(){
        $mdDialog.cancel();
        removeMask();
    }
    self.selectedDateTime = function(){
        if(angular.isUndefined(self.selectedDate)){
         self.selectedDate= self.currentDate;   
        }
        $mdDialog.hide(self.selectedDate.format(self.format));
        removeMask();
    }

    function removeMask(){
        var ele = document.getElementsByClassName("md-scroll-mask");
        if(ele.length!==0){ 
            angular.element(ele).remove();
        }            
    }

}


app.provider("smDateTimePicker", function() {
    
    this.$get = ["$mdDialog", function($mdDialog) {

        var datePicker = function(initialDate, options) {


            if (angular.isUndefined(initialDate)) initialDate = moment();


            if (!angular.isObject(options)) options = {};
            
            return $mdDialog.show({
                controller:  ['$scope','$mdDialog', '$mdMedia', '$timeout','$mdUtil','picker', DatePickerServiceCtrl],
                controllerAs: 'vm',
                bindToController: true,
                clickOutsideToClose: true,
                targetEvent: options.targetEvent,
                templateUrl: "picker/date-picker-service.html",
                locals: {
                    initialDate: initialDate,
                    options: options
                },
                skipHide: true
            });
        };
    
        return datePicker;
    }];
});


})();


(function () {
  'use strict';

  angular

    .module('smDateTimeRangePicker')


    .factory('rangeUtility', function () {
      var service = {};

      service.getMomentsForRangeOption = function (rangeOption) {
        var startDate, endDate;
        var instance = moment();

        switch (rangeOption) {
          case 'today':
            startDate = instance.clone().startOf('day');
            endDate = instance.clone().endOf('day');
            break;
          case 'past_week':
            startDate = instance.clone().subtract(7, 'd');
            endDate = instance.clone();
            break;
          case 'past_month':
            startDate = instance.clone().subtract(1, 'months');
            endDate = instance.clone();
            break;
          case 'this_month':
            startDate = instance.clone().startOf('month');
            endDate = instance.endOf('month');
            break;
          case 'previous_month':
            startDate = instance.clone().subtract(1, 'month').startOf('month');
            endDate = instance.clone().subtract(1, 'month').endOf('month');
            break;
          case 'this_quarter':
            startDate = instance.clone().startOf('quarter');
            endDate = instance.clone().endOf('quarter');
            break;
          case 'this_year':
            startDate = instance.clone().startOf('year');
            endDate = instance.clone().endOf('year');
            break;
          case 'year_to_date':
            startDate = instance.clone().startOf('year');
            endDate = instance.clone();
            break;
          default:
            console.error('invalid range');
            return undefined;
        }

        return {startDate: startDate, endDate: endDate};
      };

      service.splitRange = function (range, divider) {
        if (!range || !divider) {
          return undefined;
        }

        var values = range.split(' ' + divider + ' ');
        var startDate = values[0].trim();
        var endDate = values[1].trim();

        return {startDate: startDate, endDate: endDate};
      };

      service.extractMomentsFromRange = function (range, format, divider) {
        var splitRange = service.splitRange(range, divider);

        if (!splitRange || !service.validateRange(range, format, divider)) {
          return undefined;
        }

        return {startDate: moment(splitRange.startDate, format), endDate: moment(splitRange.endDate, format)};
      };

      service.validateRange = function (range, format, divider) {
        var splitRange = service.splitRange(range, divider);

        if (!splitRange) {
          return false;
        }

        if (moment(splitRange.startDate, format, true).isValid() && moment(splitRange.endDate, format, true).isValid()) {
          return true;
        }

        return false;
      };

      return service;
    })


    .directive('smRangePicker', ['picker', 'rangeUtility', function (picker, rangeUtility) {
      return {
        restrict: 'E',
        require: '^?ngModel',
        scope: {
          format: '@',
          divider: '@',
          weekStartDay: "@",
          customToHome: "@",
          closeOnSelect: "@",
          mode: "@",
          showCustom: '@',
          rangeSelectCall: '&',
          initialRange: '@'
        },
        templateUrl: 'picker/range-picker.html',
        link: function (scope, element, attributes, ngModel) {
          scope.okLabel = picker.okLabel;
          scope.cancelLabel = picker.cancelLabel;
          scope.format = angular.isUndefined(scope.format) ? 'MM-DD-YYYY' : scope.format;
          scope.showCustom = angular.isUndefined(scope.showCustom) ? false : scope.showCustom;
          scope.rangeSelectOptions = picker.rangeSelectOptions;
          scope.rangeCustomStartEnd = picker.rangeCustomStartEnd;
          scope.customToHome = angular.isUndefined(scope.customToHome) ? false : scope.customToHome;
          scope.divider = angular.isUndefined(scope.divider) || scope.divider === '' ? picker.rangeDivider : scope.divider;
          scope.view = 'DATE';

          scope.preDefineDate = function (rangeOption) {
            if (rangeOption === 'custom_range') {
              scope.showCustom = true;
              scope.selectedTabIndex = 0;
              return;
            }

            var rangeMoments = rangeUtility.getMomentsForRangeOption(rangeOption);

            if (!rangeMoments) {
              return;
            }

            scope.startDate = rangeMoments.startDate;
            scope.endDate = rangeMoments.endDate;

            ngModel.$setViewValue(
              scope.startDate.format(scope.format) + ' ' + scope.divider + ' ' + scope.endDate.format(scope.format)
            );
          };

          scope.startDateSelected = function (date) {
            scope.startDate = date;
            setNextView();
          };

          scope.startTimeSelected = function (time) {
            scope.startDate.hour(time.hour()).minute(time.minute());
            setNextView();
          };

          scope.endDateSelected = function (date) {
            scope.endDate = date;

            if (scope.closeOnSelect && scope.mode === 'date') {
              close(true);
            } else {
              setNextView();
            }
          };

          scope.endTimeSelected = function (time) {
            scope.endDate.hour(time.hour()).minute(time.minute());
            if (scope.closeOnSelect) {
              close(true);
            }
          };

          scope.dateRangeSelected = function () {
            close(true);
          };

          scope.cancel = function () {
            scope.showCustom = false;
            close();
          };

          function setNextView() {
            switch (scope.mode) {
              case 'date':
                scope.view = 'DATE';
                if (scope.selectedTabIndex === 0) {
                  scope.selectedTabIndex = 1
                }
                break;
              case 'date-time':
                if (scope.view === 'DATE') {
                  scope.view = 'TIME';
                } else {
                  scope.view = 'DATE';
                  if (scope.selectedTabIndex === 0) {
                    scope.selectedTabIndex = 1
                  }
                }
                break;
              default:
                scope.view = 'DATE';
                if (scope.selectedTabIndex === 0) {
                  scope.selectedTabIndex = 1
                }
            }
          }

          function close(applyDateRange) {
            if (applyDateRange) {
              ngModel.$setViewValue(
                scope.startDate.format(scope.format) + ' ' + scope.divider + ' ' + scope.endDate.format(scope.format)
              );
            }

            scope.selectedTabIndex = 0;
            scope.view = 'DATE';
            scope.$emit('range-picker:close');
          }
        }
      }
    }])


    .directive('smRangePickerInput', ['$document', '$mdMedia', '$mdUtil', 'picker', function ($document, $mdMedia, $mdUtil, picker) {
      return {
        restrict: 'EA',
        replace: true,
        scope: {
          form: '=',
          label: "@",
          fname: "@",
          value: '=',
          isRequired: '@',
          closeOnSelect: '@',
          disable: '=',
          format: '@',
          mode: '@',
          divider: '@',
          showCustom: '@',
          weekStartDay: "@",
          customToHome: "@",
          onRangeSelect: '&',
          initialRange: '@'
        },
        template:
          '<md-input-container>' +
            '<label for="{{fname}}">{{label}}</label>' +
            '<input name="{{fname}}" ng-model="value" ng-readonly="true" type="text" placeholder="{{label}}" ' +
              'aria-label="{{fname}}" ng-required="{{isRequired}}" class="sm-input-container" ng-focus="show()"' +
            '>' +
            '<div id="picker" class="sm-calender-pane md-whiteframe-15dp" ng-model="value">' +
              '<sm-range-picker custom-to-home="{{customToHome}}" mode="{{mode}}" range-select-call="rangeSelected(range)" ' +
                'close-on-select="{{closeOnSelect}}" show-custom="{{showCustom}}" week-start-day="{{weekStartDay}}" ' +
                'divider="{{divider}}" format="{{format}}" initial-range="{{initialRange}}"' +
              '></sm-range-picker>' +
            '</div>' +
          '</md-input-container>',
        link: function (scope, element) {
          var inputPane = element[0].querySelector('.sm-input-container');
          var calenderPane = element[0].querySelector('.sm-calender-pane');
          var cElement = angular.element(calenderPane);

          scope.format = angular.isUndefined(scope.format) ? 'MM-DD-YYYY' : scope.format;
          scope.startDate = angular.isUndefined(scope.value) ? scope.startDate : scope.value;

          cElement.addClass('hide hide-animate');

          $document.on('click', function (e) {
            if ((calenderPane !== e.target && inputPane !== e.target) && (!calenderPane.contains(e.target) && !inputPane.contains(e.target))) {
              hideElement();
            }
          });

          angular.element(inputPane).on('keydown', function (e) {
            if (e.which === 9) {
              hideElement();
            }
          });

          scope.rangeSelected = function (range) {
            scope.onRangeSelect({range: range});
          };

          scope.show = function () {
            var elementRect = inputPane.getBoundingClientRect();
            var bodyRect = document.body.getBoundingClientRect();
            cElement.removeClass('hide');
            if ($mdMedia('sm') || $mdMedia('xs')) {
              calenderPane.style.left = (bodyRect.width - 296) / 2 + 'px';
              calenderPane.style.top = (bodyRect.height - 450) / 2 + 'px';
            } else {
              var rect = getVisibleViewPort(elementRect, bodyRect);
              calenderPane.style.left = (rect.left) + 'px';
              calenderPane.style.top = (rect.top) + 'px';
            }

            document.body.appendChild(calenderPane);
            $mdUtil.disableScrollAround(calenderPane);
            cElement.addClass('show');
          };

          // calculate visible port to display calender
          function getVisibleViewPort(elementRect, bodyRect) {
            var calenderHeight = 460;
            var calenderWidth = 296;

            var top = elementRect.top;
            if (elementRect.top + calenderHeight > bodyRect.bottom) {
              top = elementRect.top - ((elementRect.top + calenderHeight) - (bodyRect.bottom - 20));
            }
            var left = elementRect.left;
            if (elementRect.left + calenderWidth > bodyRect.right) {
              left = elementRect.left - ((elementRect.left + calenderWidth) - (bodyRect.right - 10));
            }
            return {top: top, left: left};
          }

          scope.$on('range-picker:close', function () {
            hideElement();
          });

          scope.$on('$destroy', function () {
            calenderPane.parentNode.removeChild(calenderPane);
          });

          function hideElement() {
            cElement.addClass('hide-animate');
            cElement.removeClass('show');
            $mdUtil.enableScrolling();
          }
        }
      }
    }])


    .directive('smDateTimePicker', ['$mdUtil', '$mdMedia', '$document', 'picker', function ($mdUtil, $mdMedia, $document, picker) {
      return {
        restrict: 'E',
        replace: true,
        scope: {
          value: '=',
          startDate: '@',
          weekStartDay: '@',
          startView: "@",
          mode: '@',
          format: '@',
          minDate: '@',
          maxDate: '@',
          fname: "@",
          label: "@",
          isRequired: '@',
          disable: '=',
          form: '=',
          closeOnSelect: "@"
        },
        template:
          '<md-input-container md-no-float>' +
            '<label for="{{fname}}" >{{label }}</label>' +
            '<input name="{{fname}}" ng-model="value" type="text" placeholder="{{label}}" aria-label="{{fname}}" ng-focus="show()" ' +
              'data-ng-required="isRequired" ng-disabled="disable" server-error class="sm-input-container">' +
            '<div ng-messages="form[fname].$error" ng-if="form[fname].$touched">' +
              '<div ng-messages-include="{{ngMassagedTempaltePath}}"></div>' +
            '</div>' +
            '<div id="picker" class="sm-calender-pane md-whiteframe-15dp">' +
              '<sm-date-picker id="{{fname}}Picker" ng-model="value" initial-date="value" mode="{{mode}}" close-on-select="{{closeOnSelect}}" ' +
                'start-view="{{startView}}" data-min-date="minDate" data-max-date="maxDate" data-format="{{format}}" data-week-start-day="{{weekStartDay}}"' +
              '></sm-date-picker>' +
            '</div>' +
          '</md-input-container>',
        link: function (scope, element, attr) {
          var inputPane = element[0].querySelector('.sm-input-container');
          var calenderPane = element[0].querySelector('.sm-calender-pane');
          var cElement = angular.element(calenderPane);

          scope.noFloat = 'noFloat' in attr;
          scope.ngMassagedTempaltePath = picker.massagePath;

          // check if Pre defined format is supplied
          scope.format = angular.isUndefined(scope.format) ? 'MM-DD-YYYY' : scope.format;

          // Hide calender pane on initialization
          cElement.addClass('hide hide-animate');

          // set start date
          scope.startDate = angular.isUndefined(scope.value) ? scope.startDate : scope.value;

          // Hide Calender on click out side
          $document.on('click', function (e) {
            if ((calenderPane !== e.target && inputPane !== e.target) && (!calenderPane.contains(e.target) && !inputPane.contains(e.target))) {
              hideElement();
            }
          });

          // if tab out hide key board
          angular.element(inputPane).on('keydown', function (e) {
            if (e.which === 9) {
              hideElement();
            }
          });

          // show calender
          scope.show = function () {
            var elementRect = inputPane.getBoundingClientRect();
            var bodyRect = document.body.getBoundingClientRect();

            cElement.removeClass('hide');
            if ($mdMedia('sm') || $mdMedia('xs')) {
              calenderPane.style.left = (bodyRect.width - 320) / 2 + 'px';
              calenderPane.style.top = (bodyRect.height - 450) / 2 + 'px';
            } else {
              var rect = getVisibleViewPort(elementRect, bodyRect);
              calenderPane.style.left = (rect.left) + 'px';
              calenderPane.style.top = (rect.top) + 'px';
            }
            document.body.appendChild(calenderPane);
            $mdUtil.disableScrollAround(calenderPane);
            cElement.addClass('show');

          };

          // calculate visible port to display calender
          function getVisibleViewPort(elementRect, bodyRect) {
            var calenderHeight = 320;
            var calenderWidth = 450;

            var top = elementRect.top;
            if (elementRect.top + calenderHeight > bodyRect.bottom) {
              top = elementRect.top - ((elementRect.top + calenderHeight) - (bodyRect.bottom - 20));
            }
            var left = elementRect.left;
            if (elementRect.left + calenderWidth > bodyRect.right) {
              left = elementRect.left - ((elementRect.left + calenderWidth) - (bodyRect.right - 10));
            }
            return {top: top, left: left};
          }

          function hideElement() {
            cElement.addClass('hide-animate');
            cElement.removeClass('show');
            $mdUtil.enableScrolling();
          }

          //listen to emit for closing calender
          scope.$on('calender:close', function () {
            hideElement();
          });
        }
      }
    }])


    .run(["$templateCache", function($templateCache) {
      $templateCache.put("picker/calender-date.html","		<div  class=\"date-picker\">\r\n			<div ng-show=\"vm.view===\'YEAR_MONTH\'\" ng-class=\"{\'year-container\' : vm.view===\'YEAR_MONTH\'}\"> \r\n				<md-virtual-repeat-container id=\"year-container\" class=\"year-md-repeat\" md-top-index=\"vm.yearTopIndex\">\r\n				      <div md-virtual-repeat=\"yr in vm.yearItems\"  md-on-demand  class=\"repeated-item\">\r\n						<md-button class=\"md-button\" aria-label=\"year\" ng-click=\"vm.changeYear(yr)\" ng-class=\"{\'md-accent\': yr === vm.currentDate.year(),\r\n										\'selected-year md-primary\':vm.initialDate.year()===yr}\">\r\n							{{yr}}\r\n						</md-button>				          \r\n				      </div>\r\n				</md-virtual-repeat-container>		     \r\n			</div>				\r\n			<div ng-show=\"vm.view===\'DATE\'\" ng-class=\"{\'date-container\' : vm.view===\'DATE\'}\">\r\n				<div layout=\"row\" class=\"navigation\" layout-align=\"space-between center\">\r\n					<md-button  ng-disabled=\"vm.stopScrollPrevious\" class=\"md-icon-button scroll-button\"  aria-label=\"previous\"  ng-click=\"vm.changePeriod(\'p\')\">\r\n						<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"18\" height=\"18\" viewBox=\"0 0 18 18\"><path d=\"M15 8.25H5.87l4.19-4.19L9 3 3 9l6 6 1.06-1.06-4.19-4.19H15v-1.5z\"/></svg>\r\n					</md-button>\r\n					<md-button aria-label=\"Change Year\" class=\"md-button\" ng-class=\"vm.moveCalenderAnimation\" ng-click=\"vm.changeView(\'YEAR_MONTH\')\">\r\n						{{vm.monthList[vm.initialDate.month()]}}{{\' \'}}{{vm.initialDate.year()}}\r\n					</md-button>			\r\n					<md-button ng-disabled=\"vm.stopScrollNext\"  class=\"md-icon-button scroll-button\" aria-label=\"next\" ng-click=\"vm.changePeriod(\'n\')\">\r\n						<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"18\" height=\"18\" viewBox=\"0 0 18 18\"><path d=\"M9 3L7.94 4.06l4.19 4.19H3v1.5h9.13l-4.19 4.19L9 15l6-6z\"/></svg>							\r\n					</md-button>				\r\n				</div>			\r\n				<div class=\"date-cell-header\">\r\n					<md-button class=\"md-icon-button\" md-autofocus ng-disabled=\"true\" ng-repeat=\"dHead in vm.dateCellHeader\">\r\n						{{dHead[vm.dayHeader]}}\r\n					</md-button>\r\n				</div>		\r\n				<div \r\n					md-swipe-right=\"vm.changePeriod(\'p\')\" \r\n					class=\"date-cell-row\" \r\n					md-swipe-left=\"vm.changePeriod(\'n\')\" \r\n					ng-class=\"vm.moveCalenderAnimation\">\r\n					<div layout=\"row\" ng-repeat=\"w in vm.dateCells\" >\r\n						<md-button\r\n							ng-repeat=\"d in w\"\r\n							aria-label=\"vm.currentDate\"\r\n							class=\"md-icon-button\"\r\n							ng-click=\"vm.selectDate(d.date,d.isDisabledDate)\"\r\n							ng-disabled=\"d.isDisabledDate\"\r\n							ng-class=\"{\'md-primary sm-today\' : d.today,\r\n								\'active\':d.isCurrentMonth,\r\n								\'md-primary md-raised selected\' :d.date.isSame(vm.currentDate),\r\n								\'disabled\':d.isDisabledDate}\">\r\n							<span>{{d.dayNum}}</span>\r\n						</md-button>\r\n					</div>\r\n				</div>\r\n			</div>\r\n		</div>\r\n");
      $templateCache.put("picker/calender-hour.html","<div  class=\"time-picker\" layout=\"row\" layout-align=\"center center\">\r\n	<div>\r\n		<div layout=\"row\" class=\"navigation\">\r\n			<span class=\"md-button\">Hour</span>\r\n			<span class=\"md-button\">Minute</span>\r\n		</div>\r\n		<div layout=\"row\" >\r\n			<md-virtual-repeat-container flex=\"50\"  id=\"hour-container{{vm.uid}}\" class=\"time-md-repeat\" md-top-index=\"vm.hourTopIndex\">\r\n			<div md-virtual-repeat=\"h in vm.hourItems\" class=\"repeated-item\">\r\n						<md-button class=\"md-icon-button\" \r\n							ng-click=\"vm.setHour(h.hour)\" 							\r\n							ng-class=\"{\'md-primary\': h.isCurrent,\r\n									\'md-primary md-raised\' :h.hour===vm.currentDate.hour()}\">\r\n							{{h.hour}}\r\n						</md-button>\r\n			</div>\r\n			</md-virtual-repeat-container>		     \r\n			<md-virtual-repeat-container flex=\"50\" id=\"minute-container\" class=\"time-md-repeat\" md-top-index=\"vm.minuteTopIndex\">\r\n				<div md-virtual-repeat=\"m in vm.minuteCells\"  class=\"repeated-item\">\r\n						<md-button class=\"md-icon-button\" \r\n							ng-click=\"vm.setMinute(m.minute)\" 							\r\n							ng-class=\"{\'md-primary\': m.isCurrent,\r\n								\'md-primary md-raised\' :m.minute===vm.currentDate.minute()}\">\r\n							{{m.minute}}\r\n						</md-button>\r\n				</div>\r\n			</md-virtual-repeat-container>		     \r\n		</div>	\r\n	</div>\r\n</div>");
      $templateCache.put("picker/date-picker-service.html","<md-dialog class=\"picker-container  md-whiteframe-15dp\" aria-label=\"picker\">\r\n	<md-content  layout-xs=\"column\" layout=\"row\"  class=\"container\" >\r\n		<md-toolbar class=\"md-height\" ng-class=\"{\'portrait\': !vm.$mdMedia(\'gt-xs\'),\'landscape\': vm.$mdMedia(\'gt-xs\')}\" >			\r\n				<span class=\"year-header\" layout=\"row\" layout-xs=\"row\">{{vm.viewDate.format(\'YYYY\')}}</span>\r\n				<span class=\"date-time-header\" layout=\"row\" layout-xs=\"row\">{{vm.viewDate.format(vm.headerDispalyFormat)}}</span>\r\n		</md-toolbar>\r\n		<div layout=\"column\" class=\"picker-container\" >\r\n			<div ng-show=\"vm.view===\'DATE\'\" >\r\n				<sm-calender \r\n					ng-model=\"vm.selectedDate\"\r\n					initial-date=\"vm.selectedDate\"\r\n					id=\"{{vm.fname}}Picker\" \r\n					data-mode=\"{{vm.mode}}\" \r\n					data-min-date=\"vm.minDate\" \r\n					data-max-date=\"vm.maxDate\" \r\n					close-on-select=\"{{vm.closeOnSelect}}\"				 \r\n					data-format=\"{{vm.format}}\"  \r\n					data-week-start-day=\"{{vm.weekStartDay}}\"\r\n					date-select-call=\"vm.dateSelected(date)\">\r\n				</sm-calender>\r\n			</div>\r\n			<div ng-show=\"vm.view===\'HOUR\'\">\r\n				<sm-time\r\n					ng-model=\"vm.selectedTime\"\r\n					data-format=\"HH:mm\"\r\n					time-select-call=\"vm.timeSelected(time)\">\r\n				</sm-time>\r\n			</div>		\r\n 			<div layout=\"row\" ng-hide=\"vm.closeOnSelect && (vm.mode!==\'date-time\' || vm.mode!==\'time\')\">\r\n<!-- 					<div ng-show=\"vm.mode===\'date-time\'\">\r\n						<md-button class=\"md-icon-button\" ng-show=\"vm.view===\'DATE\'\" ng-click=\"vm.view=\'HOUR\'\">\r\n							<md-icon md-font-icon=\"material-icons md-primary\">access_time</md-icon>\r\n						</md-button>				\r\n						<md-button class=\"md-icon-button\" ng-show=\"vm.view===\'HOUR\'\" ng-click=\"vm.view=\'DATE\'\">\r\n							<md-icon md-font-icon=\"material-icons md-primary\">date_range</md-icon>\r\n						</md-button>\r\n					</div>												\r\n -->					<span flex></span>\r\n					<md-button class=\"md-button md-primary\" ng-click=\"vm.closeDateTime()\">{{vm.cancelLabel}}</md-button>\r\n					<md-button class=\"md-button md-primary\" ng-click=\"vm.selectedDateTime()\">{{vm.okLabel}}</md-button>\r\n			</div>\r\n		</div>\r\n	</md-content>	\r\n</md-dialog>");
      $templateCache.put("picker/date-picker.html","<div class=\"picker-container  md-whiteframe-15dp\">\r\n	<md-content  layout-xs=\"column\" layout=\"row\"  class=\"container\" >\r\n		<md-toolbar class=\"md-height\" ng-class=\"{\'portrait\': !$mdMedia(\'gt-xs\'),\'landscape\': $mdMedia(\'gt-xs\')}\" >			\r\n				<span class=\"year-header\" layout=\"row\" layout-xs=\"row\">{{currentDate.format(\'YYYY\')}}</span>\r\n				<span class=\"date-time-header\" layout=\"row\" layout-xs=\"row\">{{currentDate.format(headerDispalyFormat)}}</span>\r\n		</md-toolbar>\r\n		<div layout=\"column\" class=\"picker-container\" >\r\n			<div ng-show=\"view===\'DATE\'\" >\r\n				<sm-calender \r\n					ng-model=\"selectedDate\"\r\n					initial-date=\"initialDate\"					\r\n					id=\"{{fname}}Picker\" \r\n					data-mode=\"{{mode}}\" \r\n					data-min-date=\"minDate\" \r\n					data-max-date=\"maxDate\" \r\n					close-on-select=\"{{closeOnSelect}}\"				 \r\n					data-format=\"{{format}}\"  \r\n					data-week-start-day=\"{{weekStartDay}}\">\r\n				</sm-calender>\r\n			</div>\r\n			<div ng-show=\"view===\'HOUR\'\">\r\n				<sm-time\r\n					ng-model=\"selectedTime\"\r\n					data-format=\"HH:mm\">\r\n				</sm-time>\r\n			</div>		\r\n			<div layout=\"row\" ng-hide=\"closeOnSelect && (mode!==\'date-time\' || mode!==\'time\')\">\r\n					<div ng-show=\"mode===\'date-time\'\">\r\n						<md-button class=\"md-icon-button\" ng-show=\"view===\'DATE\'\" ng-click=\"view=\'HOUR\'\">\r\n							<md-icon md-font-icon=\"material-icons md-primary\">access_time</md-icon>\r\n						</md-button>				\r\n						<md-button class=\"md-icon-button\" ng-show=\"view===\'HOUR\'\" ng-click=\"view=\'DATE\'\">\r\n							<md-icon md-font-icon=\"material-icons md-primary\">date_range</md-icon>\r\n						</md-button>\r\n					</div>												\r\n					<span flex></span>\r\n					<md-button class=\"md-button md-primary\" ng-click=\"closeDateTime()\">{{cancelLabel}}</md-button>\r\n					<md-button class=\"md-button md-primary\" ng-click=\"selectedDateTime()\">{{okLabel}}</md-button>\r\n			</div>\r\n		</div>\r\n	</md-content>	\r\n</div>");
      $templateCache.put("picker/time-picker.html","<div class=\"picker-container  md-whiteframe-15dp\">\r\n	<md-content  layout-xs=\"column\" layout=\"row\"  class=\"container\" >\r\n		<md-toolbar class=\"md-height\" ng-class=\"{\'portrait\': !$mdMedia(\'gt-xs\'),\'landscape\': $mdMedia(\'gt-xs\')}\" >			\r\n				<span class=\"year-header\" layout=\"row\" layout-xs=\"row\">{{currentDate.format(\'YYYY\')}}</span>\r\n				<span class=\"date-time-header\" layout=\"row\" layout-xs=\"row\">{{currentDate.format(headerDispalyFormat)}}</span>\r\n		</md-toolbar>\r\n		<div layout=\"column\" class=\"picker-container\" >\r\n			<sm-time\r\n				ng-model=\"selectedTime\"\r\n				data-format=\"HH:mm\">\r\n			</sm-time>\r\n			<div layout=\"row\" ng-hide=\"closeOnSelect && (mode!==\'date-time\' || mode!==\'time\')\">\r\n					<div ng-show=\"mode===\'date-time\'\">\r\n						<md-button class=\"md-icon-button\" ng-show=\"view===\'DATE\'\" ng-click=\"view=\'HOUR\'\">\r\n							<md-icon md-font-icon=\"material-icons md-primary\">access_time</md-icon>\r\n						</md-button>				\r\n						<md-button class=\"md-icon-button\" ng-show=\"view===\'HOUR\'\" ng-click=\"view=\'DATE\'\">\r\n							<md-icon md-font-icon=\"material-icons md-primary\">date_range</md-icon>\r\n						</md-button>\r\n					</div>												\r\n					<span flex></span>\r\n					<md-button class=\"md-button md-primary\" ng-click=\"closeDateTime()\">{{cancelLabel}}</md-button>\r\n					<md-button class=\"md-button md-primary\" ng-click=\"selectedDateTime()\">{{okLabel}}</md-button>\r\n			</div>\r\n		</div>\r\n	</md-content>	\r\n</div>");

      $templateCache.put('picker/range-picker.html',
        '<md-content layout="column" id="{{id}}" class="range-picker md-whiteframe-2dp">' +
          '<md-toolbar layout="row" class="md-primary">' +
            '<div class="md-toolbar-tools" layout-align="space-around center">' +
              '<div class="date-display"><span>{{startDate.format(format)}}</span></div>' +
              '<div class="date-display"><span>{{endDate.format(format)}}</span></div>' +
            '</div>' +
          '</md-toolbar>' +
          '<div layout="column" class="pre-select"  role="button" ng-show="!showCustom">' +
            '<md-button ng-repeat="option in rangeSelectOptions" ng-class="{\'md-primary\': clickedButton === option.range}" ng-click="preDefineDate(option.range)">{{option.label}}</md-button>' +
          '</div>' +
          '<div layout="column" class="custom-select" ng-show="showCustom" ng-class="{\'show-calender\': showCustom}">' +
            '<div layout="row" class="tab-head">' +
              '<span ng-class="{\'active moveLeft\':selectedTabIndex === 0}">{{rangeCustomStartEnd[0]}}</span>' +
              '<span ng-class="{\'active moveLeft\':selectedTabIndex === 1}">{{rangeCustomStartEnd[1]}}</span>' +
            '</div>' +
            '<div ng-show="selectedTabIndex === 0" ng-model="startDate">' +
              '<sm-calender ng-show="view === \'DATE\'" week-start-day="{{weekStartDay}}" format="{{format}}" date-select-call="startDateSelected(date)"></sm-calender>' +
              '<sm-time ng-show="view === \'TIME\'" ng-model="selectedStartTime" time-select-call="startTimeSelected(time)"></sm-time>' +
            '</div>' +
            '<div ng-if="selectedTabIndex === 1" ng-model="endDate">' +
              '<sm-calender format="{{format}}" ng-show="view === \'DATE\'" initial-date="startDate.format(format)" min-date="startDate" week-start-day="{{weekStartDay}}" date-select-call="endDateSelected(date)"></sm-calender>' +
              '<sm-time ng-show="view === \'TIME\'" ng-model="selectedEndTime" time-select-call="endTimeSelected(time)"></sm-time>' +
            '</div>' +
          '</div>' +
          '<div layout="row" layout-align="end center">' +
            '<md-button type="button" class="md-primary" ng-click="cancel()">{{cancelLabel}}</md-button>' +
            '<md-button type="button" class="md-primary" ng-click="dateRangeSelected()">{{okLabel}}</md-button>' +
          '</div>' +
        '</md-content>'
      );
    }]);
})();

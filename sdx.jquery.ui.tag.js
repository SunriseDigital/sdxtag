(function($){
	(function($){
		var self;
		$.widget('ui.sdxTag', {
			options: {
				deleteHtml:'x',
				suggestButtonHtml: '▼',
				fieldName: 'tag[]'
			},
			_create: function()
			{
				var min_width = 40;
				
				self = this;
				
				//flag
				self._force_show_suggestion = false;
				
				//member
				self._suggest_values = ["test", 'hoge'];
				self._tag_values = [];
				
				
				//build elements
				self._list = $('<ul class="tags"></ul>');
				self.element.append(self._list);
				
				//seggestion button
				self._suggest_button = $('<div class="suggest-button">'+self.options.suggestButtonHtml+'</div>');
				self.element.append(self._suggest_button);
				
				//input text
				self._inputLine = $('<li class="new-tag"></li>');
				self._input = $('<input type="text" value="" />');
				self._list.append(self._inputLine.append(self._input));
				
				//input hidden
				self._submitFieldTpl = '<input type="hidden" name="'+self.options.fieldName+'" value="" />';
				
				self._input.width(min_width);
				self._input.sdxAutoGrowInput({
					onChange:function(data){
						self._updateSuggestion();
						if(data.value !== "")
						{
							self._showSuggestion();
						}
						else if(!self._force_show_suggestion)
						{
							self._hideSuggestion();
						}
					}
				});
				
				//class
				self.element.addClass("sdx-tag");
				
				//suggestion
				self._suggestion = $('<ul class="suggestion"></ul>')
					.appendTo(self.element)
					.hide()
					.css({
						position: 'absolute',
						backgroundColor: '#fff'
					});
				
				//Events
				self._list.bind('click.sdxTag', function(event){
					self._input.focus();
				}).bind('focusin.sdxTag', function(){
					
					self._updateSuggestion();
				});
				
				self._suggest_button.bind('click.sdxTag', function(event){
					
					if(self._force_show_suggestion)
					{
						self.hideSuggestion();
					}
					else
					{
						self.showSuggestion();
					}
				});
				
				self._input.bind('keydown.sdxTag', function(event){
					
	                if (
	                    event.which === $.ui.keyCode.COMMA
	                    ||
	                    event.which === $.ui.keyCode.ENTER
	                    ||
	                    (
	                        event.which == $.ui.keyCode.TAB &&
	                        self._input.val() !== ''
	                    ) 
	                ) {
	                    // 入力がない状態でエンターを押したらサブミット(デフォルトのアクションをする)する
	                    if (!(event.which === $.ui.keyCode.ENTER && self._input.val() === '')) 
	                    {
	                        event.preventDefault();
	                    }
	                    
	                    //選択されている時にenterを押したらタグを追加
	                    var selected = self._suggestion.find('.selected');
	                    if(event.which === $.ui.keyCode.ENTER && selected.length != 0)
	                    {
	                    	self.addTag(selected.text());
	                    }
	                    else if(self._input.val() !== '')
	                    {
	                    	self.addTag(self._input.val());
	                    }
	                }
	                else if(event.which === $.ui.keyCode.DOWN)
	                {
	                	//suggestionが表示されてなかったら表示する
	                	if(!self._force_show_suggestion)
	                	{
	                		self._showSuggestion();
	                	}
	                	
	                	self._selectNextSuggestion();
	                }
	                else if(event.which === $.ui.keyCode.UP)
	                {
	                	self._selectPrevSuggestion();
	                }
	                else if(event.which === $.ui.keyCode.BACKSPACE && self._input.val() === '')
	                {
	                	self._removeTag(self._list.find(".tag:last"));
	                }
	                
				});
			},
			showSuggestion: function()
			{
				self._force_show_suggestion = true;
	        	self._updateSuggestion();
	        	self._showSuggestion();
			},
			hideSuggestion: function()
			{
				self._force_show_suggestion = false;
	        	self._hideSuggestion();
			},
			getAllTagValues:function()
			{
				return $.merge([], self._tag_values);
			},
			addTag:function(value)
			{
				self.hideSuggestion();
				
				var value = value.split(',').join("");
				if($.inArray(value, self._tag_values) == -1)
				{
					var tag_delete = $('<span class="delete">'+self.options.deleteHtml+'</span>');
					var new_line = $('<li class="tag"><span class="value">'+value+'</span></li>');
					var inputHidden = $(self._submitFieldTpl);
					
					self._list
						.append(new_line)
						.append(self._inputLine)
						;
					
					new_line.append(tag_delete);
					tag_delete.bind('click.sdxTag', function(){
						self._removeTag(new_line);
					});
					
					new_line.append(inputHidden);
					inputHidden.val(value);
					
					self._tag_values.push(value);
				}
				
				self._input.val("");
				
				self._focusInput();
				
				self._tagDidChange();
			},
			removeAll: function()
			{
				self._tag_values = [];
				self._list.children('.tag').remove();
				self._updateSuggestion();
				self._tagDidChange();
			},
			_tagDidChange: function()
			{
				self._trigger('tagDidChange', null, {values: self.getAllTagValues(), element: self.element});
			},
			_selectNextSuggestion: function()
			{
				var word_li = self._suggestion.find('li.selected');
				var target_li;
				if(word_li.length == 0)
				{
					target_li = self._suggestion.children(':first');
				}
				else
				{
					target_li = word_li.next();
				}
				
				if(target_li.length != 0)
				{
					word_li.removeClass('selected');
					target_li.addClass('selected');
				}
			},
			_selectPrevSuggestion: function()
			{
				var word_li = self._suggestion.find('li.selected');
				var target_li = word_li.prev();
				
				if(target_li.length != 0)
				{
					word_li.removeClass('selected');
					target_li.addClass('selected');
				}
				else
				{
					word_li.removeClass('selected');
					self.hideSuggestion();
				}
			},
			_removeTag: function(line)
			{
				self._hideSuggestion();
				var value = self._getValue(line);
				
				var key = $.inArray(value, self._tag_values);
				if(key !== -1)
				{
					delete self._tag_values[key];
				}
				
				line.fadeOut('fast').hide.apply(line, ['blind', {direction: 'horizontal'}, 'fast', function(){
					line.remove();
					self._updateSuggestion();
				}]).dequeue();
			},
			_getValue: function(line)
			{
				return line.find('.value').text();
			},
			_focusInput: function()
			{
				var itv = setInterval(function(){
					
					if(self._input.is(":focus"))
					{
						clearInterval(itv);
					}
					else
					{
						self._input.focus();
					}
				}, 10);
			},
			_showSuggestion:function(){
				if(self._suggestion.children().length > 0)
				{
					self._suggestion.show();
					var offset = self.element.offset();
					offset.top += self.element.outerHeight(false);
					self._suggestion.offset(offset);
					self._suggestion.width(self.element.width());
				}
			},
			_updateSuggestion:function(){
				var value = self._input.val();
				self._suggestion.empty();
				var count = 0;
				for(var key in self._suggest_values)
				{
					var word = self._suggest_values[key];
					
					if(word.indexOf(value) === 0 && $.inArray(word, self._tag_values) === -1)
					{
						count ++;
						var li = $('<li class="word">'+word+'</li>');
						self._suggestion.append(li);
						li.bind('mouseover.sdxTag', function(){
							self._suggestion.find('.selected').removeClass('selected');
							$(this).addClass('selected');
						}).bind('click.sdxTag', function(){
							var li = $(this);
							li.addClass('selected');
							
							setTimeout(function(){
								self.addTag(li.text());
								self._hideSuggestion();
							}, 0);
							
							
						});
					}
				}
			},
			_hideSuggestion: function()
			{
				self._suggestion.hide();
			},
			destroy: function()
			{
				$.Widget.prototype.destroy.apply(self, arguments);
				return self;
			}
		});
		
	})(jQuery);
	
	
	(function($){
	
		$.fn.sdxAutoGrowInput = function(o) {
	
		    o = $.extend({
		        maxWidth: 1000,
		        minWidth: 0,
		        comfortZone: 40
		    }, o);
	
		    this.filter('input:text').each(function(){
	
		        var minWidth = o.minWidth || $(this).width();
		        var val = '';
		        var input = $(this);
		        var testSubject = $('<div class="measure"/>').css({
		                position: 'absolute',
		                visibility: 'hidden',
		                width: 'auto',
		                fontFamily: input.css('fontFamily'),
		                fontWeight: input.css('fontWeight'),
		                letterSpacing: input.css('letterSpacing'),
		                whiteSpace: 'nowrap'
		            });
		        
		         var check = function() 
		         {
		                if (val === (val = input.val())) {return;}
		                
		                var escaped = val.replace(/&/g, '&amp;').replace(/\s/g,' ').replace(/</g, '&lt;').replace(/>/g, '&gt;');
		                testSubject.html(escaped);
		                
		                var testerWidth = testSubject.width();
		                var newWidth = (testerWidth + o.comfortZone) >= minWidth ? testerWidth + o.comfortZone : minWidth;
		                var currentWidth = input.width();
		                
		                if (
	                		(newWidth < currentWidth && newWidth >= minWidth)
	                		||
	                		(newWidth > minWidth && newWidth < o.maxWidth)
		                ){
		                    input.width(newWidth);
		                }
		            };
	
		        testSubject.insertAfter(input);
	
				var observeInt;
				var prevString;
				input.focus(function(){
					var focused = true;
					observeInt = setInterval(function(){
						var value = input.val();
						if(value != prevString)
						{
							check();
							
							if(!focused)
							{
								(o.onChange||$.noop)({element:input, value:value});
							}
							
							prevString = value;
						}
						
						focused = false;
					}, 30);
				}).blur(function(){
					clearInterval(observeInt);
				});
	
		    });
		    return this;
		};
	
	})(jQuery);
})(jQuery);
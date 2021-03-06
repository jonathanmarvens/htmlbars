define(
  ["htmlbars/compiler/utils","htmlbars/compiler/helpers","htmlbars/compiler/invoke","htmlbars/compiler/elements","htmlbars/compiler/stack","htmlbars/compiler/quoting","htmlbars/runtime","htmlbars/helpers","exports"],
  function(__dependency1__, __dependency2__, __dependency3__, __dependency4__, __dependency5__, __dependency6__, __dependency7__, __dependency8__, __exports__) {
    "use strict";
    var processOpcodes = __dependency1__.processOpcodes;
    var prepareHelper = __dependency2__.prepareHelper;
    var call = __dependency3__.call;
    var helper = __dependency3__.helper;
    var pushElement = __dependency4__.pushElement;
    var popElement = __dependency4__.popElement;
    var topElement = __dependency4__.topElement;
    var pushStack = __dependency5__.pushStack;
    var popStack = __dependency5__.popStack;
    var string = __dependency6__.string;
    var quotedArray = __dependency6__.quotedArray;
    var hash = __dependency6__.hash;
    var domHelpers = __dependency7__.domHelpers;
    var helpers = __dependency8__.helpers;

    function Compiler2() {};

    var compiler2 = Compiler2.prototype;

    compiler2.compile = function(opcodes, options) {
      this.output = [];
      this.elementNumber = 0;
      this.stackNumber = 0;
      this.stack = [];
      this.children = options.children;

      this.output.push("return function template(context, options) {")
      this.preamble();
      processOpcodes(this, opcodes);
      this.postamble();
      this.output.push("};");

      // console.debug(this.output.join("\n"));

      // have the generated function close over the DOM helpers
      var generator = new Function('dom', this.output.join("\n"));
      return generator(domHelpers);
    };

    compiler2.preamble = function() {
      this.children.forEach(function(child, i) {
        this.push("var child" + i + " = " + child.toString());
      }, this);

      this.push("var element0, el");
      this.push("var frag = element0 = document.createDocumentFragment()");
    };

    compiler2.postamble = function() {
      this.output.push("return frag;");
    };

    compiler2.program = function(programId) {
      pushStack(this.stack, programId);
    };

    compiler2.content = function(str) {
      this.push(call([this.el(), 'appendChild'], helper('frag', this.el(), string(str))));
    };

    compiler2.push = function(string) {
      this.output.push(string + ";");
    };

    compiler2.el = function() {
      return topElement(this);
    };

    compiler2.id = function(parts) {
      pushStack(this.stack, string('id'));
      pushStack(this.stack, quotedArray(parts));
    };

    compiler2.literal = function(literal) {
      pushStack(this.stack, string(typeof literal));
      pushStack(this.stack, literal);
    };

    compiler2.stackLiteral = function(literal) {
      pushStack(this.stack, literal);
    };

    compiler2.string = function(str) {
      pushStack(this.stack, string('string'));
      pushStack(this.stack, string(str));
    };

    compiler2.appendText = function() {
      this.push(helper('appendText', this.el(), popStack(this.stack)));
    };

    compiler2.appendHTML = function() {
      this.push(helper('appendHTML', this.el(), popStack(this.stack)));
    };

    compiler2.appendFragment = function() {
      this.push(helper('appendFragment', this.el(), popStack(this.stack)));
    }

    compiler2.openElement = function(tagName) {
      var elRef = pushElement(this);
      this.push("var " + elRef + " = el = " + call('document.createElement', string(tagName)));
    };

    compiler2.attribute = function(name, child) {
      var invokeRererender = call('el.setAttribute', string(name), call('child' + child, 'context', hash(['rerender:rerender'])));
      var rerender = 'function rerender() { ' + invokeRererender + '}';
      var options = hash(['rerender:' + rerender, 'element:el', 'attrName:' + string(name)]);
      pushStack(this.stack, call('child' + child, 'context', options));

      this.push(call('el.setAttribute', string(name), popStack(this.stack)));
    };

    compiler2.closeElement = function() {
      var elRef = popElement(this);
      this.push(call([this.el(), 'appendChild'], elRef));
    };

    compiler2.dynamic = function(parts, escaped) {
      pushStack(this.stack, helper('resolveContents', 'context', quotedArray(parts), this.el(), escaped));
    };

    compiler2.ambiguous = function(str, escaped) {
      pushStack(this.stack, helper('ambiguousContents', this.el(), 'context', string(str), escaped));
    };

    compiler2.helper = function(name, size, escaped) {
      var prepared = prepareHelper(this.stack, size);
      pushStack(this.stack, helper('helperContents', string(name), this.el(), 'context', prepared.args, hash(prepared.options)));
    };

    compiler2.nodeHelper = function(name, size) {
      var prepared = prepareHelper(this.stack, size);
      this.push(helper('helperContents', string(name), this.el(), 'context', prepared.args, hash(prepared.options)));
    };

    __exports__.Compiler2 = Compiler2;
  });

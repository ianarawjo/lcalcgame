'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var Concept = function () {
    function Concept() {
        _classCallCheck(this, Concept);
    }

    _createClass(Concept, [{
        key: 'identifier',
        value: function identifier() {
            return 'Concept';
        }
    }, {
        key: 'parameters',
        value: function parameters() {
            return [];
        }
    }, {
        key: 'toString',
        value: function toString() {
            var arr = ['a', 'b', 'c', 'd', 'e'];
            return this.identifier() + '(' + this.parameters().reduce(function (p, c, i) {
                return p + arr[i] + ', ';
            }, '') + ')';
        }
    }]);

    return Concept;
}();

var PARAMSPACE = {
    POS_INT: 'positive integers',
    NEG_INT: 'negative integers',
    NONNEG_INT: 'nonnegative integers'
};

//**'Complexity' of instantiation is the number of grammar rules followed to create it. */
var concepts = [

/**
 * Progression graph of all concepts
 * Be clear about which language we are trying to teach
 * Iterate on progression
 * -> Target a 'good test' which is not necessarily biased towards one paradigm.
 * Figure out through backtracing what concepts to teach.
 * Implement them in a network / progression.
 * Draft planet network on paper.
 * 	-> Show TWO paths:
 * 	-> :: We can go to variable first, but we can also go late.
 * 	-> :: From this we can get player statistics on learning!
 * 	** In the morning I will design, in the afternoon I will do some implementation. **
 */

/* TERMINAL CONCEPTS
    Non-parametrized expressions are sets of terminals.
    Parametrized expressions without output types are implicit terminal types.
 */
'Shape := star | rect | tri | circle', // any primitive shape
'Integer := 1 | 2 | 3 | 4 | 5 | 6', // this will need to be more specific later
'Hole := _ | _b | __', //
'Primitive := Shape | Integer', // these are terminals
'Boolean := True | False', //
'Immutable := Primitive | Collection', //
'Null := null', 'Binding := x | xx | xxx', //
'Collection( ...Primitive )', //
'Lambda( Primitive | Collection | Hole | Lambda | Binding | Cond | Equal )', // λx.e
{
    name: 'HoleyExpression',
    takes: ['Any'],
    validator: function validator(a) {
        return recIncludes(a, 'Hole');
    }
},

/* UNEMBEDDABLE CONCEPTS
    These are still concepts that appear, but they can't be
    sequenced or chained. As such they do not appear under 'Any'.
    * Note that this too needs to be generalized,
    * but not yet for the use case we are applying it to.
 */
'-ToolboxPlace( Any )',

/* REWRITE CONCEPTS
    Expressions with output types are both leaves + rewrite rules.
    * Can be both, depends on inputs -- see def. of Cond.
*/
'Map( Identity, E:Collection ) -> E', 'Map( Lambda, Collection ) -> Collection',

// Place in a hole
// * Not sure about these!!
'Place( HoleyExpression, _, Any ) -> Any', 'Place( HoleyExpression, _b, Boolean ) -> Any', 'Place( HoleyExpression, __, Collection ) -> Any',

// Detach inner expression, leaving a hole:
'Detach( Any, Any, Hole ) -> HoleyExpression', 'Spill( Collection ) -> ...Primitive', 'BagAdd( Collection, Primitive ) -> Collection',

// Apply rules
'Apply( Lambda(T:), Any ) -> T', 'Identity := Apply( Lambda(x), E:Any ) -> E', 'Dup := Apply( Lambda(xx), E:Any ) -> E E', // Output can be a set of expressions; however len>1 forbids 'Dup' rule to be embedded (it must be top-level).
'Trip := Apply( Lambda(xxx), E:Any ) -> E E E', // This restriction can be solved with a separate Set(items) constructor not part of 'Any', but at this stage that is pedantic.

// Conditional rules
'Cond( _b, Any, Any )', 'Cond( True, B:Any, Any ) -> B', 'Cond( False, Any, E:Any ) -> E',

// Equal rule
{
    name: 'Equal',
    takes: ['Any', 'Any'],
    produces: ['True | False'],
    validator: function validator(a, b) {
        return true;
    },
    forward: function forward(a, b) {
        if (a === b) return 'True'; // These are strings representing the Boolean type in our grammar,
        else return 'False'; // not the type itself.
    },
    reverse: function reverse(bool) {
        // An inverse of the 'forward' function, so that we can backchain:
        if (bool === 'True') {
            return ['X', 'X'];
        } else {
            return ['X', 'Y'];
        }
    }
}];
/*:
 *
 * @plugindesc Modifies default conversation block,
 * prividing ablity to move faces on right side of screen and mirrord.
 * 
 * @author WickedWolfy
 * @version Version 1.3.0
 *
 * @help
 * Version 1.3.0 by WickedWolfy
 *
 * This plugin adds options for Conversations
 * and allows for placing speaker on the right side
 * as well as programmatically rotating the face-spright to mirror horizontally
 *
 *
 * Available options:
 * Add "Plugin command" in your RPG Maker MV, starting with "ww|CONVERSE" followed by options
 * - "right" - places next speaker on the right side
 * - "mirror" - mirrors next speaker's face horizontally
 * - "cont" following option - sets constant option until reset
 * - "reset" - resets all options to default (no right, no mirror)
 *
 *
 * Example use:
 * "ww|CONVERSE right" - Next speaker will be drawn on the right side
 * "ww|CONVERSE right mirror" - Next speaker will be drawn on the right side 
 *     and face image will be mirrored horizontally
 * "ww|CONVERSE right cont mirror cont" - Speaker will be drawn on the right side 
 *     and face image will be mirrored horizontally
 *     ! And this will continue until "reset" is called
 *     (This is convenient for person on the right having long dialog)
 * "ww|CONVERSE reset" - resets all options to default: no mirror or placement
 *
 *
 * Conflicts:
 * This plugin will not work with any other that overwrites listed functions
 * - drawMessageFace
 * - newLineX
 * In order to overwrite the functions properly, 
 * place under the other overwriting plugins..."
 * But if multiple plugins stake claim to overwriting not much can be done.
 *
 * If you have it and having troubles, feel free to find me on RPGMakerWeb.com forums
 * "Official thread" is here https://forums.rpgmakerweb.com/index.php?threads/mirror-portraits-in-coversation-plugin-ww-converse.97105/
 * "GitHub Location" is here https://github.com/WickedWolfy/ww-RPG-Maker-MV-scripts/tree/master/ww-converse
 *
 *
 *
 *
 * @param == Face Frame Border == 
 * @desc
 *
 * @param Face Border Color
 * @desc Color of the border around speaker's face.
 * @parent == Face Frame Border == 
 * @default white
 *
 * @param Face Border Thickness
 * @desc Thicknes (in pixels) of the border around speaker's face.
 * @parent == Face Frame Border ==
 * @type number
 * @max 4
 * @min 0
 * @default 2
 *
 *
 * @param == Face Frame BG == 
 * @desc
 *
 * @param Face BG Color
 * @desc Background colr of the face background to cover for transparency.
 * @parent == Face Frame BG ==
 * @type number
 * @default black
 *
 * @param Face BG Alpha
 * @desc Alpha/transparency of the face background block color - 0 to 1
 * @parent == Face Frame BG ==
 * @type number
 * @decimals 1
 * @max 1
 * @min 0
 * @default 0.5
 *
 *
 * @param == Message Box Options == 
 * @desc
 *
 * @param Text Spacing
 * @desc Spacing between Face image and text
 * @parent == Message Box Options ==
 * @type number
 * @default 15
 *
 * @param Window Padding
 * @desc Padding for the Message window (separation from screen edges)
 * @parent == Message Box Options ==
 * @type number
 * @default 13
 *
 * @param Window Alpha
 * @desc Opacity of the background wondow (0 to 192)
 * @parent == Message Box Options ==
 * @type number
 * @max 192
 * @min 0
 * @default 160
 *
 * @param Text Rows
 * @desc Number of text rows (usually 4)
 * @parent == Message Box Options ==
 * @type number
 * @max 10
 * @min 1
 * @default 4
 *
 * @param Message Box Width
 * @desc Width for the message box (in pixels)
 * @parent == Message Box Options ==
 * @default Graphics.boxWidth
 *
 *
 * @param == Message Box Skins ==
 * @desc
 *
 * @param Default MessageBox Skin
 * @desc Option to change Window Skin for conversation to something custom.
 * @parent == Message Box Skins ==
 * @dir img/system/
 * @type file
 *
 *
 *
 */

var Wicked = Wicked || {}; // "Wicked" object global handle
Wicked.CONVERSE = Wicked.CONVERSE || {}; // Handle for "Conversation"
(function(_){ "use strict";

	// member variables
	var aditional_text_padding = Number( PluginManager.parameters('ww_Converse')['Text Spacing'] ) || 15; // spacing between image and text, default is 20

	// face frame specific
	var face_frame_border_color = String( PluginManager.parameters('ww_Converse')['Face Border Color'] ) || 'white';
	var face_frame_border_thickness = Number( PluginManager.parameters('ww_Converse')['Face Border Thickness'] ) || 2;
	var face_frame_backdrop_color = String( PluginManager.parameters('ww_Converse')['Face BG Color'] ) || 'black';
	var face_frame_backdrop_alpha = Number( PluginManager.parameters('ww_Converse')['Face BG Alpha'] ) || 0.5;

	// overwriting standards
	var standard_padding = Number( PluginManager.parameters('ww_Converse')['Window Padding'] ) || 13; // default: 18
	var standard_opacity = Number( PluginManager.parameters('ww_Converse')['Window Alpha'] ) || 160; // default: 192
	var visible_rows = Number( PluginManager.parameters('ww_Converse')['Text Rows'] ) || 4; // default: 4
	var message_box_width = String( PluginManager.parameters('ww_Converse')['Message Box Width'] ) || '';

	// Themes
	var message_box_system_name = String( PluginManager.parameters('ww_Converse')['Default MessageBox Skin'] ) || '';

	// speaker controls
	var speaker_position_right_once = false;
	var speaker_position_right_cont = false;
	var speaker_position_mirror_once = false;
	var speaker_position_mirror_cont = false;

	// Plugin Commands
	var local__Game_Interpreter = Game_Interpreter.prototype.pluginCommand;
	Game_Interpreter.prototype.pluginCommand = function( command, args ) {
		local__Game_Interpreter.call(this, command, args);

		console.log( PluginManager.parameters('ww_Converse') );

		if ( 'ww|CONVERSE' !== command || args.length < 1 ) return;

		var index = 0;
		args.forEach(function ( loop_option ) {
			switch ( loop_option ) {
				case 'right' :
					speaker_position_right_once = true;
					if ( 'cont' === args[index + 1] ) speaker_position_right_cont = true;
				break;
				case 'mirror' :
					speaker_position_mirror_once = true;
					if ( 'cont' === args[index + 1] ) speaker_position_mirror_cont = true;
				break;
				case 'reset' :
					_.reset_all();
				break;
			}
			index++;
		});
	};

	_.is_speaker_right = function() {
		return speaker_position_right_cont || speaker_position_right_once;
	}
	_.is_speaker_mirror = function() {
		return speaker_position_mirror_cont || speaker_position_mirror_once;
	}
	_.reset_once = function() {
		speaker_position_right_once = false;
		speaker_position_mirror_once = false;
	}
	_.reset_all = function() {
		speaker_position_right_once = false;
		speaker_position_right_cont = false;
		speaker_position_mirror_once = false;
		speaker_position_mirror_cont = false;
	}

	Window_Message.prototype.drawMessageFace = function() {
		if ( !$gameMessage.faceName() ) return;

		var x = 0, y = 0;
		var width = Window_Base._faceWidth;
		var height = Window_Base._faceHeight;
		var bitmap = ImageManager.loadFace( $gameMessage.faceName() );
		var face_canvas = bitmap._canvas;
		var pw = Window_Base._faceWidth; // this is wrong
		var ph = Window_Base._faceHeight; // this is also wrong
		var sw = Math.min( width, pw );
		var sh = Math.min( height, ph );
		var dw = sw;
		var dh = sh;
		var sx = $gameMessage.faceIndex() % 4 * pw + ( pw - sw ) / 2;
		var sy = Math.floor( $gameMessage.faceIndex() / 4 ) * ph + ( ph - sh ) / 2;
		var dy = Math.floor( y + Math.max( height - ph, 0 ) / 2 );
		var ctx = this.contents._context;

		var dx = Math.floor( x + Math.max( width - pw, 0 ) / 2 ); // face left
		if ( _.is_speaker_right() ) { // face right
			var dx = _.overwrite_message_box_width() - dw - ( this.standardPadding() * 2 );

			if ( _.is_speaker_mirror() ) { // flip image horizontal
				dx = ( dx + dw ) * -1;
				ctx.scale( -1, 1 );
			}
		} else if ( _.is_speaker_mirror() ) { // face left, but mirror-flip
			dx = dw * -1;
			ctx.scale( -1, 1 );
		}

		// face background
		if ( face_frame_backdrop_alpha > 0 ) {
			ctx.fillStyle = face_frame_backdrop_color;
			ctx.globalAlpha = face_frame_backdrop_alpha;
			ctx.fillRect( dx, dy, dw, dh );
			ctx.globalAlpha = 1.0; // reset
		}

		// face
		ctx.globalCompositeOperation = 'source-over';
		ctx.drawImage( face_canvas, sx, sy, sw, sh, dx, dy, dw, dh );

		// border around face
		if ( face_frame_border_thickness > 0 ) {
			ctx.strokeStyle = face_frame_border_color;
			ctx.lineWidth = face_frame_border_thickness;
			ctx.strokeRect( dx, dy, dw, dh );
		}

		// reset any transformations, just in case
		ctx.setTransform( 1, 0, 0, 1, 0, 0 );

		// unset rotational variables
		_.reset_once();

		// schedule for clear
		this.contents._setDirty();

		// remove researvation from cache
		ImageManager.releaseReservation( this._imageReservationId );
	};

	Window_Message.prototype.newLineX = function() {
		return ( $gameMessage.faceName() === '' || _.is_speaker_right() ) 
			? aditional_text_padding 
			: ( Window_Base._faceWidth + aditional_text_padding );
	}

	//Window_Base.prototype.calcTextHeight = function(textState, all) {};
	
	var w_Window_Message__loadWindowskin = Window_Message.prototype.loadWindowskin;
	Window_Message.prototype.loadWindowskin = function() {
		if ( '' !== message_box_system_name ) {
			this.windowskin = ImageManager.loadSystem( message_box_system_name );
		} else {
			w_Window_Message__loadWindowskin.call( this );
		}
	};

	Window_Message.prototype.windowWidth = function() { return _.overwrite_message_box_width(); };
	Window_Message.prototype.numVisibleRows = function() { return visible_rows; };
	Window_Message.prototype.standardBackOpacity = function() { return standard_opacity; };
	Window_Message.prototype.standardPadding = function() { return standard_padding; };


	// Overwrites for extending for other modules... and cheating =3
	_.overwrite_message_box_width = function() {
		return eval( message_box_width ) || Graphics.boxWidth;
	};

})(Wicked.CONVERSE);
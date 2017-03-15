/**
* This class represents an action that a creep will take. Creeps should record their intended actions
* so that others (and themselves) can predict what their next state will be.
* @class
* @param actionType {CreepAction.ActionType} The type of action.
* @param target {RoomObject|RoomPosition|Direction} The target of the action.
*/
var CreepAction = function (actionType, target) {
	/** @private {RoomObject|RoomPosition} The target of the action. */
	this._target = (target instanceof RoomObject) ? target.id : target;
	/** @private {boolean} Whether or not this._target is the id of a RoomObject. */
	this._targetIsId = (target instanceof RoomObject)

	/** @property {CreepAction.ActionType} The type of the action. */
	this.actionType = actionType;

	/** 
	* Gets the target of the action
	* @returns {RoomObject|RoomPosition|undefined} The action target.
	*/
	this.getTarget = function() {
		if (this._targetIsId) return Game.getObjectById(this._target);
		else return this._target;
	}

	/**
	* Returns whether scheduling this action will cancel the other action.
	* @param otherAction {CreepAction.ActionType|CreepAction} The action already scheduled.
	* @returns {boolean} True if this action cancels the other.
	*/
	this.supercedes = function(otherAction) {
		var otherActionType = (typeof otherAction === "string") otherAction : otherAction.actionType;
		for (var i in CreepAction.priorityOrders) {
			var priorityOrder = CreepAction.priorityOrders[i];
			var thisActionIndex = -1;
			var otherActionIndex = -1;
			for (var j in priorityOrder) {
				if (this.actionType == priorityOrder[j]) thisActionIndex = j;
				if (otherActionType == priorityOrder[j]) otherActionIndex = j;
			}
			if (thisActionIndex != -1 && otherActionIndex != -1 && thisActionIndex <= otherActionIndex) return true;
		}
		return false;
	}

	/**
	* Returns whether this action is canceled when the other action is scheduled.
	* Needed because some actions are compatible, so both supercedes and isSupercededBy return false.
	* @param otherAction {CreepAction.ActionType|CreepAction} The action already scheduled.
	* @returns {boolean} True if the other action cancels this one.
	*/
	this.isSupercededBy = function(otherAction) {
		if (typeof otherAction == "string") otherAction = new CreepAction(otherAction);
		return otherAction.supercedes(this);
	}
};

/**
* This class represents a creep move action. It exists because a creep
* move can have different types that have different property needs.
* @class
* @extends CreepAction
* @param moveType {CreepMoveAction.MoveType} The move type.
* @param target {Path|Direction|RoomObject|RoomPosition} The particular target used to initialize the move.
*/
var CreepMoveAction = function (moveType, target) {
	this.getDirection = function() {

	}
}

/**
* Enum for the different types of possible creep action.
* @readonly
* @enum {string}
*/
CreepAction.ActionType = {
	ATTACK: "attack",
	ATTACK_CONTROLLER: "attackController",
	BUILD: "build",
	CLAIM_CONTROLLER: "claimController",
	DISMANTLE: "dismantle",
	DROP: "drop",
	GENERATE_SAFE_MODE: "generateSafeMode",
	HARVEST: "harvest",
	HEAL: "heal",
	MOVE: "move",
	PICKUP: "pickup",
	RANGED_ATTACK: "rangedAttack",
	RANGED_HEAL: "rangedHeal",
	RANGED_MASS_ATTACK: "rangedMassAttack",
	REPAIR: "repair",
	RESERVE_CONTROLLER: "reserveController",
	SIGN_CONTROLLER: "signController",
	SUICIDE: "suicide",
	TRANSFER: "transfer",
	UPGRADE_CONTROLLER: "upgradeController",
	WITHDRAW: "withdraw",
}

/**
* Enum for the different types of possible creep move.
* @readonly
* @enum {string}
*/
CreepMoveAction.MoveType = {
	MOVE: "move",
	MOVE_BY_PATH: "moveByPath",
	MOVE_TO: "moveTo",
}

CreepAction.priorityOrders = [
	[CreepAction.ActionType.HEAL, CreepAction.ActionType.RANGED_HEAL, CreepAction.ActionType.ATTACK_CONTROLLER, CreepAction.ActionType.DISMANTLE, CreepAction.ActionType.REPAIR, CreepAction.ActionType.BUILD, CreepAction.ActionType.ATTACK, CreepAction.ActionType.HARVEST],
	[CreepAction.ActionType.RANGED_HEAL, CreepAction.ActionType.REPAIR, CreepAction.ActionType.BUILD, CreepAction.ActionType.RANGED_MASS_ATTACK, CreepAction.ActionType.RANGED_ATTACK],
	[CreepAction.ActionType.DROP, CreepAction.ActionType.TRANSFER, CreepAction.ActionType.WITHDRAW, CreepAction.ActionType.REPAIR, CreepAction.ActionType.BUILD, CreepAction.ActionType.UPGRADE_CONTROLLER]
]
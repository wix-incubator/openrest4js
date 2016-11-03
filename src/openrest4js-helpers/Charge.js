import _ from 'lodash';
import OrderItemHelper from './OrderItem.js';
import * as availability from 'availability';
import moment from 'moment-timezone';

var self = {};

function indexOf(arr, val)
{
    for (var i in arr) if (arr[i] === val) return i;
    return -1;
}

self.isVariable = function(params) {
    var charge = params.charge;
    var type = charge.amountRuleType || 'variable';

    var buyXgetYFree = JSON.parse((charge.properties || {})['com.openrest'] || '{}').buyXgetYFree || null;
    if (buyXgetYFree) {
        return false;
    }

    return (type == 'variable');
};

self.isApplicable = function(params) {
    var charge = params.charge;
    var clubIds = params.clubIds;
    var ref = params.ref;
    var timezone = params.timezone;
    var deliveryType = params.deliveryType || '';
    var dontCheckAvailability = params.dontCheckAvailability || false;
    var skipClub = params.skipClub || false;
    var chargeUsages = params.chargeUsages || {};

    if (charge.state === 'closed') return false;

    if ((charge.refs) && (!_.isEmpty(charge.refs)) && (indexOf(charge.refs, ref) === -1)) return false;

    if ((charge.deliveryTypes) && (indexOf(charge.deliveryTypes, deliveryType) === -1)) return false;
    if (charge.inactive) return false;

    if ((typeof(charge.maxTimesPerUser) !== 'undefined') && (charge.maxTimesPerUser !== null)) {
        if ((chargeUsages[charge.id] || 0) >= charge.maxTimesPerUser) return false;
    }

    if ((!dontCheckAvailability) && (charge.availability)) {
        var now = moment.tz(timezone);

        var util = new availability.AvailabilityIterator({
            cal : now,
            availability : charge.availability || {}
        });
        if (!util.hasNext()) {
            console.log('AvailabilityIterator >> item availability hasNext returned false!');
            return false;
        }

        var status = util.next();
        if (status.status === 'unavailable') return false;
    }

    if ((charge.type) && (charge.type == 'club_coupon')) {
        if (!skipClub) {
            if (typeof(clubIds) == 'undefined') return false;
            if (typeof(charge.clubId) == 'undefined') return false;
            if (indexOf(clubIds, charge.clubId) == -1) return false;
        }
        return true;
    }

    if ((charge.type) && (charge.type == 'coupon')) {
        return true;
    }

    if ((charge.type) && (charge.type == 'tax')) {
        return true;
    }

    // TODO: Others!!!
    return false;
};

self.calculateAmount = function(params) {
    var charge = params.charge;
    var orderItems = params.orderItems;
    var maxDiscount = params.maxDiscount || 0;
    var extraCost = params.extraCost;
    var isLoggedIn = params.isLoggedIn;
    var chargeUsages = params.chargeUsages || {};
    var type = charge.amountRuleType || 'variable';

    if (typeof(maxDiscount) == 'undefined') maxDiscount = Number.MAX_VALUE;

    var minApplicableOrderPrice = JSON.parse((charge.properties || {})['com.openrest'] || '{}').minApplicableOrderPrice || 0;
    var buyXgetYFree = JSON.parse((charge.properties || {})['com.openrest'] || '{}').buyXgetYFree || null;

    // Check that the minimal application order price is valid
    var totalApplicableItems = 0;
    for (var i in orderItems) {
        var item = orderItems[i];
        if (isApplicableItem({charge:charge, itemId:item.itemId})) {
            totalApplicableItems += OrderItemHelper.getTotalPrice({orderItem:item});
        }
    }

    if (totalApplicableItems < (minApplicableOrderPrice || 0)) {
        return 0;
    }

    if ((typeof(charge.maxTimesPerUser) !== 'undefined') && (charge.maxTimesPerUser !== null)) {
        if (!isLoggedIn) return 0;

        if ((chargeUsages[charge.id] || 0) >= charge.maxTimesPerUser) return 0;
    }

    if (buyXgetYFree) {
        var x = buyXgetYFree.x;
        var y = buyXgetYFree.y;

        // Get all applicable items' price in a sorted list
        var applicableItems = _.flatten(_.compact(_.map(orderItems, function(orderItem) {
            if (!isApplicableItem({charge:charge, itemId:orderItem.itemId})) {
                return null;
            }

            return _.map(_.range(orderItem.count || 1), function() {
                return OrderItemHelper.getTotalPrice({orderItem})/(orderItem.count || 1);
            });
        }))).sort(function(x,y) { return x-y; }) // For some strange reason my chrome did not
        // agree to sort it by numeric value without the lamda function

        console.log('[ChargeHelper] buyXgetYFree applicable prices: ', applicableItems);

        // Re-calculate Y
        y = Math.min(y, applicableItems.length-x);

        // Ensure there's the right amount of items
        if (y < 0) return 0;

        console.log('[ChargeHelper] buyXgetYFree (x, y): ', x, y);

        var value = -1 * _.reduce(applicableItems.splice(0, y), function(memo, num){ return memo + num; }, 0);

        // Ick - for Ratto's
        if ((charge.id === '5807927855457115') && (value < -875)) {
            return -875;
        }
        return value;
    }

    else if (type == 'fixed') {
        for (var i in orderItems) {
            var item = orderItems[i];
            if (isApplicableItem({charge:charge, itemId:item.itemId})) {
                return Math.max(charge.amountRule, -1*maxDiscount);
            }
        }
    } else if (type == 'percentage') {
        return Math.min(calculateChargeValuePercentage({charge:charge, orderItems:orderItems, extraCost:extraCost}), maxDiscount);
    } else if (type == 'fixed_per_item') {
        var total = 0;
        for (var i in orderItems)
            {
                var item = orderItems[i];
                if (isApplicableItem({charge:charge, itemId:item.itemId}))
                {
                    var singlePrice = OrderItemHelper.getTotalPrice({orderItem:item}) / (item.count || 1);
                    var discount = Math.max(-1*singlePrice, charge.amountRule) * (item.count || 1);
                    total += discount;
                }
            }
            return total;
    } else if (type == 'variable') {
        if ((charge.variableAmountRuleType) && (charge.variableAmountRuleType == 'fixed')) {
            return Math.max(charge.variableAmountRule, -1*maxDiscount);
        } else if ((charge.variableAmountRuleType) && (charge.variableAmountRuleType == 'percentage')) {
            return Math.max(calculateChargeValuePercentage({charge:charge, orderItems:orderItems, extraCost:extraCost, percentage:charge.variableAmountRule}), -1*maxDiscount);
        } else {
            return charge.amount || 0;
        }
    }

    return 0;
}

function calculateChargeValuePercentage(params)
{
    var charge = params.charge;
    var orderItems = params.orderItems;
    var extraCost = params.extraCost;
    var percentage = params.percentage || parseInt(charge.amountRule);

    var total = 0;
    if (typeof(orderItems) != 'undefined') {
        for (var i in orderItems) {
            var item = orderItems[i];
            if (isApplicableItem({charge:charge, itemId:item.itemId})) {
                total += OrderItemHelper.getTotalPrice({orderItem:item}) * percentage / 10000;
            }
        }
    }

    if (extraCost) {
        total += extraCost * percentage / 10000;
    }

    return parseInt(total);
}

function isApplicableItem(params) {
    var charge = params.charge;
    var itemId = params.itemId;

    if ((charge.itemIds || null) === null) return true;

    var items = charge.itemIds;

    charge.mode = charge.mode || 'include';

    if (indexOf(items, itemId) == -1) {
        return (charge.mode === 'exclude');
    }
    return (charge.mode === 'include');
}

self.getTitle = function(params) {
    var charge = params.charge;
    var i18n = params.i18n;
    var defaultLocale = params.defaultLocale;

    if ((charge.type) && (charge.type == 'club_coupon')) {
        return charge.coupon.title[i18n.getLocale()] || charge.coupon.title[defaultLocale];
    }
    if ((charge.type) && (charge.type == 'coupon')) {
        return charge.coupon.title[i18n.getLocale()] || charge.coupon.title[defaultLocale];
    }
    if ((charge.type) && (charge.type == 'tax')) {
        return i18n.get('openrest_common_tax');
    }

    return '';
}

self.getDescription = function(params)
{
    var charge = params.charge;
    var i18n = params.i18n;
    var defaultLocale = params.defaultLocale;

    if ((charge.type) && ((charge.type == 'club_coupon') || (charge.type == 'coupon'))) {
        var ret = '';

        if (charge.coupon.description) ret = charge.coupon.description[i18n.getLocale()] || charge.coupon.description[defaultLocale];

        return ret;
    }

    return undefined;
}

export default self;

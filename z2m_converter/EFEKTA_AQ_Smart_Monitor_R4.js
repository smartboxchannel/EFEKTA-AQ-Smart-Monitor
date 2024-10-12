// ############################################################################//
//                                                                             //
//    ... перезагрузить z2m, что бы конвертер применился                       //
//                                                                             //
//#############################################################################//



const fz = require('zigbee-herdsman-converters/converters/fromZigbee');
const tz = require('zigbee-herdsman-converters/converters/toZigbee');
const exposes = require('zigbee-herdsman-converters/lib/exposes');
const constants = require('zigbee-herdsman-converters/lib/constants');
const reporting = require('zigbee-herdsman-converters/lib/reporting');
const e = exposes.presets;
const ea = exposes.access;

const tzLocal = {
	co2_config: {
        key: ['auto_brightness', 'forced_recalibration', 'factory_reset_co2', 'long_chart_period', 'set_altitude',
            'manual_forced_recalibration', 'light_indicator', 'light_ind_level', 'automatic_scal', 'reading_delay'],
        convertSet: async (entity, key, rawValue, meta) => {
            const lookup = {'OFF': 0x00, 'ON': 0x01};
            const value = lookup.hasOwnProperty(rawValue) ? lookup[rawValue] : parseInt(rawValue, 10);
            const payloads = {
                auto_brightness: ['msCO2', {0x0203: {value, type: 0x10}}],
                forced_recalibration: ['msCO2', {0x0202: {value, type: 0x10}}],
                factory_reset_co2: ['msCO2', {0x0206: {value, type: 0x10}}],
                long_chart_period: ['msCO2', {0x0204: {value, type: 0x10}}],
                set_altitude: ['msCO2', {0x0205: {value, type: 0x21}}],
                manual_forced_recalibration: ['msCO2', {0x0207: {value, type: 0x21}}],
				light_indicator: ['msCO2', {0x0211: {value, type: 0x10}}],
				light_ind_level: ['msCO2', {0x0209: {value, type: 0x20}}],
				automatic_scal: ['msCO2', {0x0402: {value, type: 0x10}}],
				reading_delay: ['msCO2', {0x0201: {value, type: 0x21}}],
            };
            await entity.write(payloads[key][0], payloads[key][1]);
            return {
                state: {[key]: rawValue},
            };
        },
    },
	temperaturef_config: {
        key: ['temperature_offset'],
        convertSet: async (entity, key, rawValue, meta) => {
            const value = parseFloat(rawValue)*10;
            const payloads = {
                temperature_offset: ['msTemperatureMeasurement', {0x0410: {value, type: 0x29}}],
            };
            await entity.write(payloads[key][0], payloads[key][1]);
            return {
                state: {[key]: rawValue},
            };
        },
    },
    humidity_config: {
        key: ['humidity_offset'],
        convertSet: async (entity, key, rawValue, meta) => {
            const value = parseInt(rawValue, 10);
            const payloads = {
                humidity_offset: ['msRelativeHumidity', {0x0210: {value, type: 0x29}}],
            };
            await entity.write(payloads[key][0], payloads[key][1]);
            return {
                state: {[key]: rawValue},
            };
        },
    },
	co2_gasstat_config: {
        key: ['high_co2_gas', 'low_co2_gas', 'enable_co2_gas', 'invert_logic_co2_gas'],
        convertSet: async (entity, key, rawValue, meta) => {
            const lookup = {'OFF': 0x00, 'ON': 0x01};
            const value = lookup.hasOwnProperty(rawValue) ? lookup[rawValue] : parseInt(rawValue, 10);
            const payloads = {
                high_co2_gas: ['msCO2', {0x0221: {value, type: 0x21}}],
                low_co2_gas: ['msCO2', {0x0222: {value, type: 0x21}}],
				enable_co2_gas: ['msCO2', {0x0220: {value, type: 0x10}}],
				invert_logic_co2_gas: ['msCO2', {0x0225: {value, type: 0x10}}],
            };
            await entity.write(payloads[key][0], payloads[key][1]);
            return {
                state: {[key]: rawValue},
            };
        },
    },
	voc_gasstat_config: {
        key: ['high_voc_gas', 'low_voc_gas', 'enable_voc_gas', 'invert_logic_voc_gas'],
        convertSet: async (entity, key, rawValue, meta) => {
            const lookup = {'OFF': 0x00, 'ON': 0x01};
            const value = lookup.hasOwnProperty(rawValue) ? lookup[rawValue] : parseInt(rawValue, 10);
            const payloads = {
                high_voc_gas: ['genAnalogInput', {0x0221: {value, type: 0x21}}],
                low_voc_gas: ['genAnalogInput', {0x0222: {value, type: 0x21}}],
				enable_voc_gas: ['genAnalogInput', {0x0220: {value, type: 0x10}}],
				invert_logic_voc_gas: ['genAnalogInput', {0x0225: {value, type: 0x10}}],
            };
            await entity.write(payloads[key][0], payloads[key][1]);
            return {
                state: {[key]: rawValue},
            };
        },
    },
};

const fzLocal = {
	co2: {
        cluster: 'msCO2',
        type: ['attributeReport', 'readResponse'],
        convert: (model, msg, publish, options, meta) => {
			if (msg.data.hasOwnProperty('measuredValue')) {
				return {co2: Math.round(msg.data.measuredValue * 1000000)};
			}
        },
    },
	air_quality: {
        cluster: 'genAnalogInput',
        type: ['attributeReport', 'readResponse'],
        convert: (model, msg, publish, options, meta) => {
			const result = {};
            if (msg.data.hasOwnProperty(0x0065)) {
                result.voc_raw_data = parseFloat(msg.data[0x0065]);
            }
			if (msg.data.hasOwnProperty('presentValue')) {
			    result.voc_index = msg.data.presentValue;
			}
			return result;
        },
    },
	co2_config: {
        cluster: 'msCO2',
        type: ['attributeReport', 'readResponse'],
        convert: (model, msg, publish, options, meta) => {
            const result = {};
            if (msg.data.hasOwnProperty(0x0202)) {
                result.forced_recalibration = ['OFF', 'ON'][msg.data[0x0202]];
            }
            if (msg.data.hasOwnProperty(0x0206)) {
                result.factory_reset_co2 = ['OFF', 'ON'][msg.data[0x0206]];
            }
            if (msg.data.hasOwnProperty(0x0205)) {
                result.set_altitude = msg.data[0x0205];
            }
            if (msg.data.hasOwnProperty(0x0207)) {
                result.manual_forced_recalibration = msg.data[0x0207];
            }
			if (msg.data.hasOwnProperty(0x0211)) {
				result.light_indicator = ['OFF', 'ON'][msg.data[0x0211]];
            }
			if (msg.data.hasOwnProperty(0x0209)) {
                result.light_ind_level = msg.data[0x0209];
            }
			if (msg.data.hasOwnProperty(0x0402)) {
                result.automatic_scal = ['OFF', 'ON'][msg.data[0x0402]];
            }
			if (msg.data.hasOwnProperty(0x0201)) {
                result.reading_delay = msg.data[0x0201];
            }
            return result;
        },
    },
	temperaturef_config: {
        cluster: 'msTemperatureMeasurement',
        type: ['attributeReport', 'readResponse'],
        convert: (model, msg, publish, options, meta) => {
            const result = {};
            if (msg.data.hasOwnProperty(0x0410)) {
                result.temperature_offset = parseFloat(msg.data[0x0410])/10.0;
            }
            return result;
        },
    },
    humidity_config: {
        cluster: 'msRelativeHumidity',
        type: ['attributeReport', 'readResponse'],
        convert: (model, msg, publish, options, meta) => {
            const result = {};
            if (msg.data.hasOwnProperty(0x0210)) {
                result.humidity_offset = msg.data[0x0210];
            }
            return result;
        },
    },
	co2_gasstat_config: {
        cluster: 'msCO2',
        type: ['attributeReport', 'readResponse'],
        convert: (model, msg, publish, options, meta) => {
            const result = {};
            if (msg.data.hasOwnProperty(0x0221)) {
                result.high_co2_gas = msg.data[0x0221];
            }
			if (msg.data.hasOwnProperty(0x0222)) {
                result.low_co2_gas = msg.data[0x0222];
            }
            if (msg.data.hasOwnProperty(0x0220)) {
                result.enable_co2_gas = ['OFF', 'ON'][msg.data[0x0220]];
            }
			if (msg.data.hasOwnProperty(0x0225)) {
                result.invert_logic_co2_gas = ['OFF', 'ON'][msg.data[0x0225]];
            }
            return result;
        },
    },
	voc_gasstat_config: {
        cluster: 'genAnalogInput',
        type: ['attributeReport', 'readResponse'],
        convert: (model, msg, publish, options, meta) => {
            const result = {};
            if (msg.data.hasOwnProperty(0x0221)) {
                result.high_voc_gas = msg.data[0x0221];
            }
			if (msg.data.hasOwnProperty(0x0222)) {
                result.low_voc_gas = msg.data[0x0222];
            }
            if (msg.data.hasOwnProperty(0x0220)) {
                result.enable_voc_gas = ['OFF', 'ON'][msg.data[0x0220]];
            }
			if (msg.data.hasOwnProperty(0x0225)) {
                result.invert_logic_voc_gas = ['OFF', 'ON'][msg.data[0x0225]];
            }
            return result;
        },
    },
};

const definition = {
        zigbeeModel: ['EFEKTA_AQ_Smart_Monitor'],
        model: 'EFEKTA_AQ_Smart_Monitor',
        vendor: 'EfektaLab',
        description: '[EFEKTA CO2 & VOC Index Smart Monitor, ws2812b indicator, can control the relay, binding on some other devices](https://efektalab.com/CO2_Monitor)',
        fromZigbee: [fz.temperature, fz.humidity, fzLocal.co2, fzLocal.air_quality, fzLocal.co2_config, fzLocal.temperaturef_config, fzLocal.humidity_config, fzLocal.co2_gasstat_config, fzLocal.voc_gasstat_config],
        toZigbee: [tz.factory_reset, tzLocal.co2_config, tzLocal.temperaturef_config, tzLocal.humidity_config, tzLocal.co2_gasstat_config, tzLocal.voc_gasstat_config],
        configure: async (device, coordinatorEndpoint, logger) => {
            const endpoint = device.getEndpoint(1);
            const clusters = ['msTemperatureMeasurement', 'msRelativeHumidity', 'msCO2', 'genAnalogInput'];
			await reporting.bind(endpoint, coordinatorEndpoint, clusters);
			const payload1 = [{attribute: {ID: 0x0000, type: 0x39},
            minimumReportInterval: 0, maximumReportInterval: 600, reportableChange: 0}];
            await endpoint.configureReporting('msCO2', payload1);
			const payload2 = [{attribute: {ID: 0x0000, type: 0x29},
            minimumReportInterval: 0, maximumReportInterval: 600, reportableChange: 0}];
			await endpoint.configureReporting('msTemperatureMeasurement', payload2);
			const payload3 = [{attribute: {ID: 0x0000, type: 0x21},
            minimumReportInterval: 0, maximumReportInterval: 600, reportableChange: 0}];
			await endpoint.configureReporting('msRelativeHumidity', payload3);
			const payload4 = [{attribute: {ID: 0x0055, type: 0x39},
            minimumReportInterval: 0, maximumReportInterval: 300, reportableChange: 0}];
			await endpoint.configureReporting('genAnalogInput', payload4);
        },
		icon: 'data:image/jpeg;base64,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AAAAABAASAAAAAEAAQBIAAAAAQABOEJJTQQmAAAAAAAOAAAAAAAAAAAAAD+AAAA4QklNBA0AAAAAAAQAAABaOEJJTQQZAAAAAAAEAAAAHjhCSU0D8wAAAAAACQAAAAAAAAAAAQA4QklNJxAAAAAAAAoAAQAAAAAAAAABOEJJTQP1AAAAAABIAC9mZgABAGxmZgAGAAAAAAABAC9mZgABAKGZmgAGAAAAAAABADIAAAABAFoAAAAGAAAAAAABADUAAAABAC0AAAAGAAAAAAABOEJJTQP4AAAAAABwAAD/////////////////////////////A+gAAAAA/////////////////////////////wPoAAAAAP////////////////////////////8D6AAAAAD/////////////////////////////A+gAADhCSU0EAAAAAAAAAgABOEJJTQQCAAAAAAAEAAAAADhCSU0EMAAAAAAAAgEBOEJJTQQtAAAAAAAGAAEAAAACOEJJTQQIAAAAAAAQAAAAAQAAAkAAAAJAAAAAADhCSU0EHgAAAAAABAAAAAA4QklNBBoAAAAAA0sAAAAGAAAAAAAAAAAAAAB9AAAAfQAAAAsEEQQ1BDcAIAQ4BDwENQQ9BDgALQAxAAAAAQAAAAAAAAAAAAAAAAAAAAAAAAABAAAAAAAAAAAAAAB9AAAAfQAAAAAAAAAAAAAAAAAAAAABAAAAAAAAAAAAAAAAAAAAAAAAABAAAAABAAAAAAAAbnVsbAAAAAIAAAAGYm91bmRzT2JqYwAAAAEAAAAAAABSY3QxAAAABAAAAABUb3AgbG9uZwAAAAAAAAAATGVmdGxvbmcAAAAAAAAAAEJ0b21sb25nAAAAfQAAAABSZ2h0bG9uZwAAAH0AAAAGc2xpY2VzVmxMcwAAAAFPYmpjAAAAAQAAAAAABXNsaWNlAAAAEgAAAAdzbGljZUlEbG9uZwAAAAAAAAAHZ3JvdXBJRGxvbmcAAAAAAAAABm9yaWdpbmVudW0AAAAMRVNsaWNlT3JpZ2luAAAADWF1dG9HZW5lcmF0ZWQAAAAAVHlwZWVudW0AAAAKRVNsaWNlVHlwZQAAAABJbWcgAAAABmJvdW5kc09iamMAAAABAAAAAAAAUmN0MQAAAAQAAAAAVG9wIGxvbmcAAAAAAAAAAExl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d3MpIiB4bXA6Q3JlYXRlRGF0ZT0iMjAyMy0xMS0xN1QxNzo0NjozNSswMzowMCIgeG1wOk1ldGFkYXRhRGF0ZT0iMjAyMy0xMS0xN1QxNzo0NjozNSswMzowMCIgeG1wOk1vZGlmeURhdGU9IjIwMjMtMTEtMTdUMTc6NDY6MzUrMDM6MDAiIHhtcE1NOkluc3RhbmNlSUQ9InhtcC5paWQ6ZTFlMzAxMDItZjM1YS0xNjRkLTg5YWEtMmI5YzY1NDg4ZTVhIiB4bXBNTTpEb2N1bWVudElEPSJhZG9iZTpkb2NpZDpwaG90b3Nob3A6MGM4N2I5ZTQtZmMxMy01NzQ1LTg0MDktMjNhODI4MmEzYTgzIiB4bXBNTTpPcmlnaW5hbERvY3VtZW50SUQ9InhtcC5kaWQ6OWY5ODFhNjUtZDg1ZC05YzQ3LTg4ZGQtMTgzMTM1Nzk5YmQ0IiBkYzpmb3JtYXQ9ImltYWdlL2pwZWciIHBob3Rvc2hvcDpDb2xvck1vZGU9IjMiPiA8eG1wTU06SGlzdG9yeT4gPHJkZjpTZXE+IDxyZGY6bGkgc3RFdnQ6YWN0aW9uPSJjcmVhdGVkIiBzdEV2dDppbnN0YW5jZUlEPSJ4bXAuaWlkOjlmOTgxYTY1LWQ4NWQtOWM0Ny04OGRkLTE4MzEzNTc5OWJkNCIgc3RFdnQ6d2hlbj0iMjAyMy0xMS0xN1QxNzo0NjozNSswMzowMCIgc3RFdnQ6c29mdHdhcmVBZ2VudD0iQWRvYmUgUGhvdG9zaG9wIENDIDIwMTggKFdpbmRvd3MpIi8+IDxyZGY6bGkgc3RFdnQ6YWN0aW9uPSJzYXZlZCIgc3RFdnQ6aW5zdGFuY2VJRD0ieG1wLmlpZDplMWUzMDEwMi1mMzVhLTE2NGQtODlhYS0yYjljNjU0ODhlNWEiIHN0RXZ0OndoZW49IjIwMjMtMTEtMTdUMTc6NDY6MzUrMDM6MDAiIHN0RXZ0OnNvZnR3YXJlQWdlbnQ9IkFkb2JlIFBob3Rvc2hvcCBDQyAyMDE4IChXaW5kb3dzKSIgc3RFdnQ6Y2hhbmdlZD0iLyIvPiA8L3JkZjpTZXE+IDwveG1wTU06SGlzdG9yeT4gPC9yZGY6RGVzY3JpcHRpb24+IDwvcmRmOlJERj4gPC94OnhtcG1ldGE+ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPD94cGFja2V0IGVuZD0idyI/Pv/uACFBZG9iZQBkQAAAAAEDABADAgMGAAAAAAAAAAAAAAAA/9sAhAABAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAgICAgICAgICAgIDAwMDAwMDAwMDAQEBAQEBAQEBAQECAgECAgMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwP/wgARCAB9AH0DAREAAhEBAxEB/8QAxwAAAQMFAQEBAAAAAAAAAAAABAMFBgIHCAkKCwABAQACAwEBAQAAAAAAAAAAAAABAgADBAUGBxAAAQMDAwMDBAIDAQAAAAAAAQIDBAARBRIGBxAhCEETCTEiFAogMiMVFzMRAAEFAAEDBAECBAUDBQAAAAQBAgMFBhEAEgchExQVMSIWQVEjCGEyJCUXcYFCUnJDJjYSAAEDAgUBBgUDBQEAAAAAAAEAEQIhMRBBYRIDUfBxkaEiMiCBweETsdEE8UJSYiNj/9oADAMBAQIRAxEAAADnL18Apa1CqpHywmEAkMFsEeZHVgKIQAIjVuALG/ArdYrooMIRqJDjJsr3w7PO4wLZp+XZqOTVgBTpocrwUmIo/wCIylta7AuKkpAZul5+b09PyjzEFZ/i4dx/Otp9BJy4QNTRepmlkeSlUUaCBm3vrfgbBNFESsiUl+KJaTPd5lw9FKTBAkijt1bfWIstRTLUS3Geky/no5aaY1xL6vxH1CYOjxEN1JpIlAUGRosFuRxlLsVaCdkxq7XzwYfNGRwkZZTGo5B6PQ6D2vdIVRDZWMt3zhwlYIRtI6djz+kac4pLbnI0HdSXp86+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',
        exposes: [e.co2(), 
		    exposes.numeric('voc_index', ea.STATE).withUnit('voc index points').withDescription('VOC INDEX'),
			e.temperature(), e.humidity(),
		    exposes.numeric('reading_delay', ea.STATE_SET).withUnit('Seconds').withDescription('Setting the sensor reading delay. Setting the time in seconds, by default 15 seconds')
                .withValueMin(15).withValueMax(600),
            exposes.binary('light_indicator', ea.STATE_SET, 'ON', 'OFF').withDescription('Enable or Disable light_indicator'),
			exposes.numeric('light_ind_level', ea.STATE_SET).withUnit('%').withDescription('light_indicator_level')
                .withValueMin(0).withValueMax(100),
			exposes.numeric('set_altitude', ea.STATE_SET).withUnit('meters').withDescription('Setting the altitude above sea level (for high accuracy of the CO2 sensor)')
                .withValueMin(0).withValueMax(3000),
			exposes.numeric('temperature_offset', ea.STATE_SET).withUnit('°C').withValueStep(0.1).withDescription('Adjust temperature')
                .withValueMin(-50.0).withValueMax(50.0),
            exposes.numeric('humidity_offset', ea.STATE_SET).withUnit('%').withDescription('Adjust humidity')
                .withValueMin(-50).withValueMax(50),
			exposes.binary('forced_recalibration', ea.STATE_SET, 'ON', 'OFF').withDescription('Start FRC (Perform Forced Recalibration of the CO2 Sensor in the fresh air)'),
			exposes.numeric('manual_forced_recalibration', ea.STATE_SET).withUnit('ppm').withDescription('Start FRC (Perform Forced Recalibration of the CO2 Sensor according to data from another sensor)')
                .withValueMin(0).withValueMax(5000),
			exposes.binary('automatic_scal', ea.STATE_SET, 'ON', 'OFF')
			    .withDescription('Automatic self calibration'),
			exposes.binary('factory_reset_co2', ea.STATE_SET, 'ON', 'OFF').withDescription('Factory Reset CO2 sensor'),
			exposes.binary('enable_co2_gas', ea.STATE_SET, 'ON', 'OFF').withDescription('Enable CO2 Gas Control'),
			exposes.binary('invert_logic_co2_gas', ea.STATE_SET, 'ON', 'OFF').withDescription('Enable invert logic CO2 Gas Control'),
            exposes.numeric('high_co2_gas', ea.STATE_SET).withUnit('ppm').withDescription('Setting High CO2 Gas Border')
                .withValueMin(400).withValueMax(2000),
            exposes.numeric('low_co2_gas', ea.STATE_SET).withUnit('ppm').withDescription('Setting Low CO2 Gas Border')
                .withValueMin(400).withValueMax(2000),
			exposes.binary('enable_voc_gas', ea.STATE_SET, 'ON', 'OFF').withDescription('Enable VOC Control'),
			exposes.binary('invert_logic_voc_gas', ea.STATE_SET, 'ON', 'OFF').withDescription('Enable invert logic VOC Control'),
            exposes.numeric('high_voc_gas', ea.STATE_SET).withUnit('voc index points').withDescription('Setting High VOC Border')
                .withValueMin(0).withValueMax(500),
            exposes.numeric('low_voc_gas', ea.STATE_SET).withUnit('voc index points').withDescription('Setting Low VOC Border')
                .withValueMin(0).withValueMax(500)],
};

module.exports = definition;

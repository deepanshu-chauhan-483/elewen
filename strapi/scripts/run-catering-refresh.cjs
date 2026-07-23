#!/usr/bin/env node
'use strict';

process.env.CATERING_REFRESH_EXISTING = '1';
require('./run-catering-all.cjs');

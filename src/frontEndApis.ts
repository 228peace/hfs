// This file is part of HFS - Copyright 2020-2021, Massimo Melina <a@rejetto.com> - License https://www.gnu.org/licenses/gpl-3.0.txt

import { ApiHandlers } from './apis'
import { file_list } from './api.file_list'
import * as api_auth from './api.auth'

export const frontEndApis: ApiHandlers = {
    file_list,
    ...api_auth,
}

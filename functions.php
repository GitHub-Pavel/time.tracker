<?php
// Variables
$fileURL = 'data-set.json';
$request_data = json_decode( file_get_contents('php://input'), true);

// Read json file
$file = json_decode( file_get_contents($fileURL), true);

if ($file == '') {
    $file = [];
}

// Sending data
if ($request_data['event'] == 'btnClick') {
    echo json_encode(fileDecode(fileChange($file, $fileURL, $request_data)));
} elseif ($request_data['event'] == 'history') {
    echo json_encode(fileDecode($file));
} elseif ($request_data['event'] == 'removeTask') {
    echo json_encode(fileDecode(removeById(intval($request_data['id']), $fileURL, $file)));
} elseif ($request_data['event'] == 'removeDate') {
    echo json_encode(fileDecode(removeByDate($request_data['ids'], $fileURL, $file)));
} elseif ($request_data['event'] == 'changesInput') {
    echo json_encode(changesValue($request_data, $fileURL, $file));
}

/*
 * File changes
 * */
function fileChange($file_data, $URL, $data) {
    $file_count = count($file_data);

    if ($file_count == 0) {
        $file_data[0]['ID'] = 0;
        $file_data[0]['TASK'] = $data['task'];
        $file_data[0]['START'] = time();
    } else {
        if (!(isset($file_data[$file_count - 1]['END']))) {
            $file_data[$file_count - 1]['END'] = time();
        } else {
            $file_data[$file_count]['ID'] = $file_count;
            $file_data[$file_count]['TASK'] = $data['task'];
            $file_data[$file_count]['START'] = time();
        }
    }

    file_put_contents( $URL,json_encode($file_data) );
    return $file_data;
}

/*
 * Decode $file to send to the site
 * */
function fileDecode($file_data) {
    $data = [];

    foreach ($file_data as $key => $item) {
        $date_day = date('d.m.Y',$item['START']);

        $all_hours = (intval(date('H',$item['END'])) - intval(date('H',$item['START']))) * 60;
        $all_minutes = intval(date('i',$item['END'])) - intval(date('i',$item['START']));

        $data[$date_day]['massive'][$item['ID']]['id'] = $item['ID'];
        $data[$date_day]['massive'][$item['ID']]['task'] = $item['TASK'];
        $data[$date_day]['massive'][$item['ID']]['start'] = date('H:i',$item['START']);

        if ($item['SUBMENU'] === 'active') {
            $data[$date_day]['submenu'] = $item['SUBMENU'];
        }

        if ($item['EVENT'] === 'changesValue') {
            $data[$date_day]['event'] = $item['EVENT'];
        } else {
            $data[$date_day]['event'] = 'nothing';
        }

        if (isset($item['END'])) {
            $data[$date_day]['massive'][$item['ID']]['end'] = date('H:i', $item['END']);
            $data[$date_day]['massive'][$item['ID']]['hours'] = intval(($all_hours + $all_minutes) / 60);
            $data[$date_day]['massive'][$item['ID']]['minutes'] = ($all_hours + $all_minutes) % 60;
            $data[$date_day]['massive'][$item['ID']]['allTime'] = $all_hours + $all_minutes;
            $data[$date_day]['massive'][$item['ID']]['ready'] = true;
        } else {
            $data[$date_day]['massive'][$item['ID']]['ready'] = false;
        }
    }

    return $data;
}

/*
 * Remove element by ID
 */
function removeById($id, $URL, $file_data) {
    $data = [];
    $byDate = '';

    foreach ($file_data as $key => $item) {
        if ($item['ID'] == $id) {
            $byDate = date('d.m.Y',$item['START']);
        }
    }

    foreach ($file_data as $key => $item) {
        if ($byDate == date('d.m.Y',$item['START'])) {
            $file_data[$key]['SUBMENU'] = 'active';
        }
    }

    foreach ($file_data as $key => $item) {
        if ($item['ID'] !== $id) {
            if ($item['ID'] > $id) {
                --$item['ID'];
                array_push($data, $item);
            } else {
                array_push($data, $item);
            }
        }
    }

    file_put_contents( $URL,json_encode($data) );
    return $data;
}

/*
 * Remove by Date
 */
function removeByDate($ids, $URL, $file_data) {
    $data = [];
    $id = 0;

    foreach ($file_data as $key => $item) {
        foreach ($ids as $i) {
            if ($item['ID'] === intval($i)) {
                unset($file_data[$key]);
            }
        }
    }

    foreach ($file_data as $key => $item) {
        $item['ID'] = $id;
        $id++;
        array_push($data, $item);
    }

    file_put_contents( $URL,json_encode($data) );
    return $data;
}

/*
 * Changes value task
 */
function changesValue($request_data, $URL, $file_data) {
    $data = [];
    $dataRequest = [];

    foreach ($file_data as $key => $item) {
        if ($item['ID'] == $request_data['id']) {
            $item['TASK'] = $request_data['value'];

            if ($request_data['target'] == 'task-input') {
                $dataRequest['target'] = $request_data['id'];
            } else {
                if(!isset($file_data[$request_data['id']]['END'])) {
                    $dataRequest['target'] = 'task-input';
                }
            }
            $dataRequest['value'] = $request_data['value'];
        }
        array_push($data, $item);
    }

    file_put_contents( $URL,json_encode($data) );
    return $dataRequest;
}
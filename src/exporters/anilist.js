export function exportToAniList(subscriptions) {
    let xml = '<?xml version="1.0" encoding="UTF-8" ?>\n';
    xml += '<myanimelist>\n';
    xml += '    <myinfo>\n';
    xml += '        <user_export_type>2</user_export_type>\n';
    xml += '    </myinfo>\n';

    subscriptions.forEach(sub => {
        // Use enriched MU title if available, otherwise original title
        // Enriched title is preferred for better fuzzy matching on AniList
        const title = sub.mu_title || sub.title;

        xml += '    <manga>\n';
        // ID 0 forces AniList to use title for matching
        xml += '        <manga_mangadb_id>0</manga_mangadb_id>\n';
        xml += `        <manga_title><![CDATA[${title}]]></manga_title>\n`;
        xml += '        <manga_volumes>0</manga_volumes>\n';
        xml += '        <manga_chapters>0</manga_chapters>\n';
        xml += '        <my_read_volumes>0</my_read_volumes>\n';
        xml += '        <my_read_chapters>0</my_read_chapters>\n';
        xml += '        <my_start_date>0000-00-00</my_start_date>\n';
        xml += '        <my_finish_date>0000-00-00</my_finish_date>\n';
        xml += '        <my_scans_group><![CDATA[]]></my_scans_group>\n';
        xml += '        <my_score>0</my_score>\n';
        xml += '        <my_storage></my_storage>\n';
        xml += '        <my_status>Plan to Watch</my_status>\n';
        xml += '        <my_comments><![CDATA[Imported via WeebCentral Extractor (MangaUpdates Match)]]></my_comments>\n';
        xml += '        <my_times_read>0</my_times_read>\n';
        xml += '        <my_tags><![CDATA[]]></my_tags>\n';
        xml += '        <my_reread_value>0</my_reread_value>\n';
        xml += '        <update_on_import>1</update_on_import>\n';
        xml += '    </manga>\n';
    });

    xml += '</myanimelist>';
    return xml;
}

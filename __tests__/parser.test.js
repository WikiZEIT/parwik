import { describe, it, expect } from 'vitest';
import { parse, version } from '../index.js';

describe('parwik', () => {
    describe('version', () => {
        it('should export a version string', () => {
            expect(version).toBe('0.1.0');
        });
    });

    describe('plain text', () => {
        it('should parse plain text', () => {
            expect(parse('hello world')).toEqual([
                { type: 'text', value: 'hello world' }
            ]);
        });

        it('should fail on bare < not followed by a tag name', () => {
            expect(() => parse('hello & goodbye < world > 2026')).toThrow();
        });

        it('should parse empty string', () => {
            expect(parse('')).toEqual([]);
        });
    });

    describe('headings', () => {
        it('should parse h1', () => {
            expect(parse('= Heading =\n')).toEqual([
                { type: 'heading', level: 1, content: 'Heading' }
            ]);
        });

        it('should parse h2', () => {
            expect(parse('== Heading ==\n')).toEqual([
                { type: 'heading', level: 2, content: 'Heading' }
            ]);
        });

        it('should parse h3', () => {
            expect(parse('=== Heading ===\n')).toEqual([
                { type: 'heading', level: 3, content: 'Heading' }
            ]);
        });

        it('should parse h4', () => {
            expect(parse('==== Heading ====\n')).toEqual([
                { type: 'heading', level: 4, content: 'Heading' }
            ]);
        });

        it('should parse h5', () => {
            expect(parse('===== Heading =====\n')).toEqual([
                { type: 'heading', level: 5, content: 'Heading' }
            ]);
        });

        it('should parse h6', () => {
            expect(parse('====== Heading ======\n')).toEqual([
                { type: 'heading', level: 6, content: 'Heading' }
            ]);
        });

        it('should parse heading with extra whitespace', () => {
            expect(parse('==  Spaced Heading  ==\n')).toEqual([
                { type: 'heading', level: 2, content: 'Spaced Heading' }
            ]);
        });
    });

    describe('bold', () => {
        it('should parse bold text', () => {
            expect(parse("'''bold'''")).toEqual([
                { type: 'bold', children: [{ type: 'text', value: 'bold' }] }
            ]);
        });

        it('should parse bold with surrounding text', () => {
            expect(parse("before '''bold''' after")).toEqual([
                { type: 'text', value: 'before ' },
                { type: 'bold', children: [{ type: 'text', value: 'bold' }] },
                { type: 'text', value: ' after' }
            ]);
        });
    });

    describe('italic', () => {
        it('should parse italic text', () => {
            expect(parse("''italic''")).toEqual([
                { type: 'italic', children: [{ type: 'text', value: 'italic' }] }
            ]);
        });

        it('should parse italic with surrounding text', () => {
            expect(parse("before ''italic'' after")).toEqual([
                { type: 'text', value: 'before ' },
                { type: 'italic', children: [{ type: 'text', value: 'italic' }] },
                { type: 'text', value: ' after' }
            ]);
        });
    });

    describe('bold and italic combined', () => {
        it('should parse bold containing italic', () => {
            expect(parse("'''bold ''and italic'''''")).toEqual([
                {
                    type: 'bold',
                    children: [
                        { type: 'text', value: 'bold ' },
                        { type: 'italic', children: [{ type: 'text', value: 'and italic' }] }
                    ]
                }
            ]);
        });

        it('should fail on ambiguous 5-quote ending (italic containing bold)', () => {
            expect(() => parse("''italic '''and bold'''''")).toThrow();
        });
    });

    describe('external links', () => {
        it('should parse external link', () => {
            expect(parse('[https://example.com Example]')).toEqual([
                { type: 'external_link', url: 'https://example.com', description: 'Example' }
            ]);
        });

        it('should parse external link with complex URL', () => {
            expect(parse('[https://example.com/path?q=1&r=2#hash Link Text]')).toEqual([
                {
                    type: 'external_link',
                    url: 'https://example.com/path?q=1&r=2#hash',
                    description: 'Link Text'
                }
            ]);
        });

        it('should parse http link', () => {
            expect(parse('[http://example.com HTTP Link]')).toEqual([
                { type: 'external_link', url: 'http://example.com', description: 'HTTP Link' }
            ]);
        });

        it('should parse ftp link', () => {
            expect(parse('[ftp://files.example.com FTP Server]')).toEqual([
                { type: 'external_link', url: 'ftp://files.example.com', description: 'FTP Server' }
            ]);
        });
    });

    describe('internal links', () => {
        it('should parse simple internal link', () => {
            expect(parse('[[Page]]')).toEqual([
                { type: 'internal_link', title: 'Page', label: null, suffix: '' }
            ]);
        });

        it('should parse internal link with label', () => {
            expect(parse('[[Page|display text]]')).toEqual([
                { type: 'internal_link', title: 'Page', label: 'display text', suffix: '' }
            ]);
        });

        it('should parse internal link with suffix', () => {
            expect(parse('[[cat]]s')).toEqual([
                { type: 'internal_link', title: 'cat', label: null, suffix: 's' }
            ]);
        });

        it('should parse internal link with label and suffix', () => {
            expect(parse('[[nation|national]]ism')).toEqual([
                { type: 'internal_link', title: 'nation', label: 'national', suffix: 'ism' }
            ]);
        });

        it('should parse internal link with spaces in title', () => {
            expect(parse('[[Source Code]]')).toEqual([
                { type: 'internal_link', title: 'Source Code', label: null, suffix: '' }
            ]);
        });
    });

    describe('templates', () => {
        it('should parse simple template', () => {
            expect(parse('{{Stub}}')).toEqual([
                { type: 'template', name: 'Stub', params: [] }
            ]);
        });

        it('should parse template with positional params', () => {
            expect(parse('{{cite|value1|value2}}')).toEqual([
                {
                    type: 'template',
                    name: 'cite',
                    params: [
                        { type: 'positional_param', value: [{ type: 'text', value: 'value1' }] },
                        { type: 'positional_param', value: [{ type: 'text', value: 'value2' }] }
                    ]
                }
            ]);
        });

        it('should parse template with named params', () => {
            expect(parse('{{cite|author=Smith|year=2026}}')).toEqual([
                {
                    type: 'template',
                    name: 'cite',
                    params: [
                        { type: 'named_param', key: 'author', value: [{ type: 'text', value: 'Smith' }] },
                        { type: 'named_param', key: 'year', value: [{ type: 'text', value: '2026' }] }
                    ]
                }
            ]);
        });

        it('should parse template with mixed params', () => {
            expect(parse('{{info|positional|key=named}}')).toEqual([
                {
                    type: 'template',
                    name: 'info',
                    params: [
                        { type: 'positional_param', value: [{ type: 'text', value: 'positional' }] },
                        { type: 'named_param', key: 'key', value: [{ type: 'text', value: 'named' }] }
                    ]
                }
            ]);
        });
    });

    describe('XML tags', () => {
        it('should parse self-closing tag', () => {
            expect(parse('<br/>')).toEqual([
                { type: 'xml_tag', name: 'br', attrs: [], selfClosing: true, children: [] }
            ]);
        });

        it('should parse tag with content', () => {
            expect(parse('<ref>content</ref>')).toEqual([
                {
                    type: 'xml_tag',
                    name: 'ref',
                    attrs: [],
                    selfClosing: false,
                    children: [{ type: 'text', value: 'content' }]
                }
            ]);
        });

        it('should parse self-closing tag with attributes', () => {
            expect(parse('<img src="photo.jpg" alt="A photo"/>')).toEqual([
                {
                    type: 'xml_tag',
                    name: 'img',
                    attrs: [
                        { key: 'src', value: 'photo.jpg' },
                        { key: 'alt', value: 'A photo' }
                    ],
                    selfClosing: true,
                    children: []
                }
            ]);
        });

        it('should parse tag with attributes and content', () => {
            expect(parse('<div class="note" id="n1">hello</div>')).toEqual([
                {
                    type: 'xml_tag',
                    name: 'div',
                    attrs: [
                        { key: 'class', value: 'note' },
                        { key: 'id', value: 'n1' }
                    ],
                    selfClosing: false,
                    children: [{ type: 'text', value: 'hello' }]
                }
            ]);
        });

        it('should parse tag with single-quoted attribute values', () => {
            expect(parse("<span class='highlight'>text</span>")).toEqual([
                {
                    type: 'xml_tag',
                    name: 'span',
                    attrs: [{ key: 'class', value: 'highlight' }],
                    selfClosing: false,
                    children: [{ type: 'text', value: 'text' }]
                }
            ]);
        });

        it('should parse tag with hyphenated/namespaced attributes', () => {
            expect(parse('<div data-id="42" xml:lang="en">content</div>')).toEqual([
                {
                    type: 'xml_tag',
                    name: 'div',
                    attrs: [
                        { key: 'data-id', value: '42' },
                        { key: 'xml:lang', value: 'en' }
                    ],
                    selfClosing: false,
                    children: [{ type: 'text', value: 'content' }]
                }
            ]);
        });
    });

    describe('deeply nested structures', () => {
        it('should parse XML tags nested inside XML tags', () => {
            const result = parse('<div class="outer"><span class="inner">text</span></div>');
            expect(result).toEqual([
                {
                    type: 'xml_tag',
                    name: 'div',
                    attrs: [{ key: 'class', value: 'outer' }],
                    selfClosing: false,
                    children: [
                        {
                            type: 'xml_tag',
                            name: 'span',
                            attrs: [{ key: 'class', value: 'inner' }],
                            selfClosing: false,
                            children: [{ type: 'text', value: 'text' }]
                        }
                    ]
                }
            ]);
        });

        it('should parse three levels of nested XML tags with attributes', () => {
            const input = '<div id="l1" class="a"><section data-type="content"><p style="bold">deep</p></section></div>';
            const result = parse(input);
            expect(result).toEqual([
                {
                    type: 'xml_tag',
                    name: 'div',
                    attrs: [
                        { key: 'id', value: 'l1' },
                        { key: 'class', value: 'a' }
                    ],
                    selfClosing: false,
                    children: [
                        {
                            type: 'xml_tag',
                            name: 'section',
                            attrs: [{ key: 'data-type', value: 'content' }],
                            selfClosing: false,
                            children: [
                                {
                                    type: 'xml_tag',
                                    name: 'p',
                                    attrs: [{ key: 'style', value: 'bold' }],
                                    selfClosing: false,
                                    children: [{ type: 'text', value: 'deep' }]
                                }
                            ]
                        }
                    ]
                }
            ]);
        });

        it('should parse template inside XML tag with attributes', () => {
            const result = parse('<ref name="src1">{{cite|author=Smith}}</ref>');
            expect(result).toEqual([
                {
                    type: 'xml_tag',
                    name: 'ref',
                    attrs: [{ key: 'name', value: 'src1' }],
                    selfClosing: false,
                    children: [
                        {
                            type: 'template',
                            name: 'cite',
                            params: [
                                {
                                    type: 'named_param',
                                    key: 'author',
                                    value: [{ type: 'text', value: 'Smith' }]
                                }
                            ]
                        }
                    ]
                }
            ]);
        });

        it('should parse nested templates inside XML tag', () => {
            const input = '<ref name="n1">{{cite|title={{lang|en|Hello}}}}</ref>';
            const result = parse(input);
            expect(result).toEqual([
                {
                    type: 'xml_tag',
                    name: 'ref',
                    attrs: [{ key: 'name', value: 'n1' }],
                    selfClosing: false,
                    children: [
                        {
                            type: 'template',
                            name: 'cite',
                            params: [
                                {
                                    type: 'named_param',
                                    key: 'title',
                                    value: [
                                        {
                                            type: 'template',
                                            name: 'lang',
                                            params: [
                                                { type: 'positional_param', value: [{ type: 'text', value: 'en' }] },
                                                { type: 'positional_param', value: [{ type: 'text', value: 'Hello' }] }
                                            ]
                                        }
                                    ]
                                }
                            ]
                        }
                    ]
                }
            ]);
        });

        it('should parse bold and italic inside XML tags', () => {
            const input = "<div class=\"article\">'''bold'' and ''italic''</div>";
            const result = parse(input);
            expect(result[0].type).toBe('xml_tag');
            expect(result[0].name).toBe('div');
            expect(result[0].attrs).toEqual([{ key: 'class', value: 'article' }]);
        });

        it('should parse internal link inside bold inside XML tag', () => {
            const input = "<span class=\"ref\">'''[[Page|display]]'''</span>";
            const result = parse(input);
            expect(result).toEqual([
                {
                    type: 'xml_tag',
                    name: 'span',
                    attrs: [{ key: 'class', value: 'ref' }],
                    selfClosing: false,
                    children: [
                        {
                            type: 'bold',
                            children: [
                                { type: 'internal_link', title: 'Page', label: 'display', suffix: '' }
                            ]
                        }
                    ]
                }
            ]);
        });

        it('should parse external link inside italic inside XML tag', () => {
            const input = "<div id=\"links\">''[https://example.com click here]''</div>";
            const result = parse(input);
            expect(result).toEqual([
                {
                    type: 'xml_tag',
                    name: 'div',
                    attrs: [{ key: 'id', value: 'links' }],
                    selfClosing: false,
                    children: [
                        {
                            type: 'italic',
                            children: [
                                {
                                    type: 'external_link',
                                    url: 'https://example.com',
                                    description: 'click here'
                                }
                            ]
                        }
                    ]
                }
            ]);
        });

        it('should parse nested templates (3 levels deep)', () => {
            const input = '{{outer|param={{middle|val={{inner|x=1}}}}}}';
            const result = parse(input);
            expect(result).toEqual([
                {
                    type: 'template',
                    name: 'outer',
                    params: [
                        {
                            type: 'named_param',
                            key: 'param',
                            value: [
                                {
                                    type: 'template',
                                    name: 'middle',
                                    params: [
                                        {
                                            type: 'named_param',
                                            key: 'val',
                                            value: [
                                                {
                                                    type: 'template',
                                                    name: 'inner',
                                                    params: [
                                                        {
                                                            type: 'named_param',
                                                            key: 'x',
                                                            value: [{ type: 'text', value: '1' }]
                                                        }
                                                    ]
                                                }
                                            ]
                                        }
                                    ]
                                }
                            ]
                        }
                    ]
                }
            ]);
        });

        it('should parse multiple nested templates as sibling params', () => {
            const input = '{{infobox|name={{first}} {{last}}|born={{date|1990|1|1}}}}';
            const result = parse(input);
            expect(result[0].type).toBe('template');
            expect(result[0].name).toBe('infobox');
            expect(result[0].params).toHaveLength(2);
            expect(result[0].params[0].type).toBe('named_param');
            expect(result[0].params[0].key).toBe('name');
            expect(result[0].params[0].value).toEqual([
                { type: 'template', name: 'first', params: [] },
                { type: 'text', value: ' ' },
                { type: 'template', name: 'last', params: [] }
            ]);
            expect(result[0].params[1].type).toBe('named_param');
            expect(result[0].params[1].key).toBe('born');
            expect(result[0].params[1].value).toEqual([
                {
                    type: 'template',
                    name: 'date',
                    params: [
                        { type: 'positional_param', value: [{ type: 'text', value: '1990' }] },
                        { type: 'positional_param', value: [{ type: 'text', value: '1' }] },
                        { type: 'positional_param', value: [{ type: 'text', value: '1' }] }
                    ]
                }
            ]);
        });
    });

    describe('stress: deeply nested mixed content', () => {
        it('should parse template with nested template inside XML tag with multiple attributes', () => {
            const input =
                '<ref name="cite1" group="notes">' +
                '{{cite web|url=https://example.com|title={{lang|en|Hello World}}|date=2026}}' +
                '</ref>';
            const result = parse(input);
            expect(result).toEqual([
                {
                    type: 'xml_tag',
                    name: 'ref',
                    attrs: [
                        { key: 'name', value: 'cite1' },
                        { key: 'group', value: 'notes' }
                    ],
                    selfClosing: false,
                    children: [
                        {
                            type: 'template',
                            name: 'cite web',
                            params: [
                                {
                                    type: 'named_param',
                                    key: 'url',
                                    value: [{ type: 'text', value: 'https://example.com' }]
                                },
                                {
                                    type: 'named_param',
                                    key: 'title',
                                    value: [
                                        {
                                            type: 'template',
                                            name: 'lang',
                                            params: [
                                                { type: 'positional_param', value: [{ type: 'text', value: 'en' }] },
                                                { type: 'positional_param', value: [{ type: 'text', value: 'Hello World' }] }
                                            ]
                                        }
                                    ]
                                },
                                {
                                    type: 'named_param',
                                    key: 'date',
                                    value: [{ type: 'text', value: '2026' }]
                                }
                            ]
                        }
                    ]
                }
            ]);
        });

        it('should parse bold template inside nested XML tags with attributes', () => {
            const input =
                '<div class="wrapper" id="main">' +
                "<section data-role='content'>" +
                "'''{{highlight|text=important}}'''" +
                '</section>' +
                '</div>';
            const result = parse(input);
            expect(result).toEqual([
                {
                    type: 'xml_tag',
                    name: 'div',
                    attrs: [
                        { key: 'class', value: 'wrapper' },
                        { key: 'id', value: 'main' }
                    ],
                    selfClosing: false,
                    children: [
                        {
                            type: 'xml_tag',
                            name: 'section',
                            attrs: [{ key: 'data-role', value: 'content' }],
                            selfClosing: false,
                            children: [
                                {
                                    type: 'bold',
                                    children: [
                                        {
                                            type: 'template',
                                            name: 'highlight',
                                            params: [
                                                {
                                                    type: 'named_param',
                                                    key: 'text',
                                                    value: [{ type: 'text', value: 'important' }]
                                                }
                                            ]
                                        }
                                    ]
                                }
                            ]
                        }
                    ]
                }
            ]);
        });

        it('should parse italic link inside template inside XML tag', () => {
            const input = "<ref name=\"x\">{{note|text=''[[Article|see this]]''}}</ref>";
            const result = parse(input);
            expect(result[0].type).toBe('xml_tag');
            expect(result[0].name).toBe('ref');
            expect(result[0].children[0].type).toBe('template');
            expect(result[0].children[0].name).toBe('note');
        });

        it('should parse complex Wikipedia-like article fragment', () => {
            const input =
                '== History ==\n' +
                "The '''[[JavaScript]]''' language was created in 1995" +
                '<ref name="history" group="web">' +
                '{{cite web|url=https://example.com/js-history|title=JS History|author={{person|Eich}}}}' +
                '</ref>.\n';
            const result = parse(input);

            expect(result[0]).toEqual({
                type: 'heading',
                level: 2,
                content: 'History'
            });

            expect(result[1].type).toBe('text');
            expect(result[1].value).toBe('The ');

            expect(result[2]).toEqual({
                type: 'bold',
                children: [
                    { type: 'internal_link', title: 'JavaScript', label: null, suffix: '' }
                ]
            });

            expect(result[3].type).toBe('text');

            const ref = result[4];
            expect(ref.type).toBe('xml_tag');
            expect(ref.name).toBe('ref');
            expect(ref.attrs).toEqual([
                { key: 'name', value: 'history' },
                { key: 'group', value: 'web' }
            ]);
            expect(ref.children[0].type).toBe('template');
            expect(ref.children[0].name).toBe('cite web');
            expect(ref.children[0].params).toHaveLength(3);

            const authorParam = ref.children[0].params[2];
            expect(authorParam.type).toBe('named_param');
            expect(authorParam.key).toBe('author');
            expect(authorParam.value[0].type).toBe('template');
            expect(authorParam.value[0].name).toBe('person');
            expect(authorParam.value[0].params[0].value).toEqual([
                { type: 'text', value: 'Eich' }
            ]);
        });

        it('should parse self-closing tags mixed with templates and wiki markup', () => {
            const input =
                "'''Important'''<br/>" +
                '{{note|type=warning}}' +
                '<hr/>' +
                '[[Main Page|home]]';
            const result = parse(input);

            expect(result[0]).toEqual({
                type: 'bold',
                children: [{ type: 'text', value: 'Important' }]
            });
            expect(result[1]).toEqual({
                type: 'xml_tag',
                name: 'br',
                attrs: [],
                selfClosing: true,
                children: []
            });
            expect(result[2]).toEqual({
                type: 'template',
                name: 'note',
                params: [
                    {
                        type: 'named_param',
                        key: 'type',
                        value: [{ type: 'text', value: 'warning' }]
                    }
                ]
            });
            expect(result[3]).toEqual({
                type: 'xml_tag',
                name: 'hr',
                attrs: [],
                selfClosing: true,
                children: []
            });
            expect(result[4]).toEqual({
                type: 'internal_link',
                title: 'Main Page',
                label: 'home',
                suffix: ''
            });
        });

        it('should parse 4-level deep nesting: XML > XML > bold > template with nested template', () => {
            const input =
                '<div class="outer" data-level="1">' +
                '<span class="inner" data-level="2">' +
                "'''{{format|style={{color|red}}}}'''" +
                '</span>' +
                '</div>';
            const result = parse(input);

            const div = result[0];
            expect(div.type).toBe('xml_tag');
            expect(div.name).toBe('div');
            expect(div.attrs).toEqual([
                { key: 'class', value: 'outer' },
                { key: 'data-level', value: '1' }
            ]);

            const span = div.children[0];
            expect(span.type).toBe('xml_tag');
            expect(span.name).toBe('span');
            expect(span.attrs).toEqual([
                { key: 'class', value: 'inner' },
                { key: 'data-level', value: '2' }
            ]);

            const bold = span.children[0];
            expect(bold.type).toBe('bold');

            const tmpl = bold.children[0];
            expect(tmpl.type).toBe('template');
            expect(tmpl.name).toBe('format');

            const styleParam = tmpl.params[0];
            expect(styleParam.type).toBe('named_param');
            expect(styleParam.key).toBe('style');
            expect(styleParam.value[0].type).toBe('template');
            expect(styleParam.value[0].name).toBe('color');
            expect(styleParam.value[0].params[0].value).toEqual([
                { type: 'text', value: 'red' }
            ]);
        });

        it('should parse XML > bold > internal link with suffix', () => {
            const input = '<ref name="animals">\'\'\'[[cat]]s\'\'\'</ref>';
            const result = parse(input);
            expect(result).toEqual([
                {
                    type: 'xml_tag',
                    name: 'ref',
                    attrs: [{ key: 'name', value: 'animals' }],
                    selfClosing: false,
                    children: [
                        {
                            type: 'bold',
                            children: [
                                { type: 'internal_link', title: 'cat', label: null, suffix: 's' }
                            ]
                        }
                    ]
                }
            ]);
        });

        it('should parse deeply nested templates (4 levels)', () => {
            const input = '{{a|p={{b|q={{c|r={{d|val}}}}}}}}';
            const result = parse(input);
            expect(result[0].type).toBe('template');
            expect(result[0].name).toBe('a');

            const b = result[0].params[0].value[0];
            expect(b.type).toBe('template');
            expect(b.name).toBe('b');

            const c = b.params[0].value[0];
            expect(c.type).toBe('template');
            expect(c.name).toBe('c');

            const d = c.params[0].value[0];
            expect(d.type).toBe('template');
            expect(d.name).toBe('d');
            expect(d.params[0].value).toEqual([{ type: 'text', value: 'val' }]);
        });

        it('should parse multiple sibling templates inside XML tag', () => {
            const input =
                '<div class="infobox" data-type="person" role="complementary">' +
                '{{name|first=John|last=Doe}}' +
                '{{born|date={{date|1990|6|15}}|place=NYC}}' +
                '</div>';
            const result = parse(input);

            expect(result[0].type).toBe('xml_tag');
            expect(result[0].attrs).toHaveLength(3);
            expect(result[0].children).toHaveLength(2);

            const nameTemplate = result[0].children[0];
            expect(nameTemplate.type).toBe('template');
            expect(nameTemplate.name).toBe('name');
            expect(nameTemplate.params).toHaveLength(2);

            const bornTemplate = result[0].children[1];
            expect(bornTemplate.type).toBe('template');
            expect(bornTemplate.name).toBe('born');
            expect(bornTemplate.params[0].value[0].type).toBe('template');
            expect(bornTemplate.params[0].value[0].name).toBe('date');
        });

        it('should parse text mixed with XML and wiki markup', () => {
            const input =
                'Before ' +
                '<div class="note" id="n1">' +
                '{{tpl|arg={{inner}}}}' +
                '</div>' +
                ' after [[Page]]';
            const result = parse(input);

            expect(result[0]).toEqual({ type: 'text', value: 'Before ' });

            const div = result[1];
            expect(div.type).toBe('xml_tag');
            expect(div.attrs).toEqual([
                { key: 'class', value: 'note' },
                { key: 'id', value: 'n1' }
            ]);
            expect(div.children[0].type).toBe('template');
            expect(div.children[0].name).toBe('tpl');

            expect(result[2]).toEqual({ type: 'text', value: ' after ' });
            expect(result[3]).toEqual({
                type: 'internal_link',
                title: 'Page',
                label: null,
                suffix: ''
            });
        });

        it('should parse XML with many attributes and nested wiki content', () => {
            const input =
                '<table class="wikitable sortable" border="1" cellpadding="5" cellspacing="0" style="width:100%">' +
                "'''[[Header|Column 1]]'''" +
                '{{format|align=center}}' +
                "''italic text''" +
                '</table>';
            const result = parse(input);

            const table = result[0];
            expect(table.type).toBe('xml_tag');
            expect(table.name).toBe('table');
            expect(table.attrs).toEqual([
                { key: 'class', value: 'wikitable sortable' },
                { key: 'border', value: '1' },
                { key: 'cellpadding', value: '5' },
                { key: 'cellspacing', value: '0' },
                { key: 'style', value: 'width:100%' }
            ]);
            expect(table.children).toHaveLength(3);

            expect(table.children[0].type).toBe('bold');
            expect(table.children[0].children[0].type).toBe('internal_link');
            expect(table.children[1].type).toBe('template');
            expect(table.children[2].type).toBe('italic');
        });

        it('should parse 5-level deep nesting: XML > XML > XML > bold > template(template)', () => {
            const input =
                '<article id="main">' +
                '<section class="body" data-idx="1">' +
                '<p class="text">' +
                "'''{{wrap|content={{fmt|v=deep}}}}'''" +
                '</p>' +
                '</section>' +
                '</article>';
            const result = parse(input);

            const article = result[0];
            expect(article.type).toBe('xml_tag');
            expect(article.name).toBe('article');

            const section = article.children[0];
            expect(section.type).toBe('xml_tag');
            expect(section.name).toBe('section');
            expect(section.attrs).toEqual([
                { key: 'class', value: 'body' },
                { key: 'data-idx', value: '1' }
            ]);

            const p = section.children[0];
            expect(p.type).toBe('xml_tag');
            expect(p.name).toBe('p');

            const bold = p.children[0];
            expect(bold.type).toBe('bold');

            const wrap = bold.children[0];
            expect(wrap.type).toBe('template');
            expect(wrap.name).toBe('wrap');

            const contentParam = wrap.params[0];
            expect(contentParam.value[0].type).toBe('template');
            expect(contentParam.value[0].name).toBe('fmt');
            expect(contentParam.value[0].params[0].key).toBe('v');
            expect(contentParam.value[0].params[0].value).toEqual([
                { type: 'text', value: 'deep' }
            ]);
        });

        it('should parse external link inside bold inside template param inside XML', () => {
            const input =
                '<ref name="src" group="nb">' +
                "{{cite|note='''[https://example.com/path?x=1 Link Title]'''}}" +
                '</ref>';
            const result = parse(input);

            const ref = result[0];
            expect(ref.type).toBe('xml_tag');
            expect(ref.attrs).toEqual([
                { key: 'name', value: 'src' },
                { key: 'group', value: 'nb' }
            ]);
        });

        it('should parse real-world Wikipedia infobox pattern', () => {
            const input =
                '{{Infobox person' +
                '|name=John Doe' +
                '|birth_date={{birth date|1990|1|15}}' +
                '|birth_place={{city|New York|US}}' +
                '|occupation=Software engineer' +
                '|website={{URL|https://example.com}}' +
                '}}';
            const result = parse(input);

            expect(result[0].type).toBe('template');
            expect(result[0].name).toBe('Infobox person');
            expect(result[0].params).toHaveLength(5);

            const birthDate = result[0].params[1];
            expect(birthDate.key).toBe('birth_date');
            expect(birthDate.value[0].type).toBe('template');
            expect(birthDate.value[0].name).toBe('birth date');

            const birthPlace = result[0].params[2];
            expect(birthPlace.key).toBe('birth_place');
            expect(birthPlace.value[0].type).toBe('template');
            expect(birthPlace.value[0].name).toBe('city');

            const website = result[0].params[4];
            expect(website.key).toBe('website');
            expect(website.value[0].type).toBe('template');
            expect(website.value[0].name).toBe('URL');
        });

        it('should parse heading followed by complex nested paragraph', () => {
            const input =
                '=== References ===\n' +
                '<div class="reflist" style="column-width:30em">' +
                '<ref name="a1">{{cite|author={{person|Smith|John}}|year=2026}}</ref>' +
                "<ref name=\"a2\">{{cite|title=''An Article''|url=https://example.com}}</ref>" +
                '</div>';
            const result = parse(input);

            expect(result[0]).toEqual({ type: 'heading', level: 3, content: 'References' });

            const div = result[1];
            expect(div.type).toBe('xml_tag');
            expect(div.attrs).toEqual([
                { key: 'class', value: 'reflist' },
                { key: 'style', value: 'column-width:30em' }
            ]);
            expect(div.children).toHaveLength(2);

            const ref1 = div.children[0];
            expect(ref1.type).toBe('xml_tag');
            expect(ref1.name).toBe('ref');
            expect(ref1.children[0].type).toBe('template');

            const ref2 = div.children[1];
            expect(ref2.type).toBe('xml_tag');
            expect(ref2.name).toBe('ref');
            expect(ref2.children[0].type).toBe('template');
        });

        it('should parse complex multi-line document', () => {
            const input =
                '== Overview ==\n' +
                "'''[[Parwik]]''' is a ''[[wiki]]'' parser.\n" +
                '=== Features ===\n' +
                'Supports {{feature|name=templates|nested={{yes}}}}' +
                '<ref name="docs" group="note">' +
                '{{cite web|url=https://github.com/jcubic/parwik|title={{lang|en|Parwik Docs}}}}' +
                '</ref>' +
                ' and [[Internal Links|links]].\n';
            const result = parse(input);

            expect(result[0]).toEqual({ type: 'heading', level: 2, content: 'Overview' });

            const boldLink = result[1];
            expect(boldLink.type).toBe('bold');
            expect(boldLink.children[0].type).toBe('internal_link');
            expect(boldLink.children[0].title).toBe('Parwik');

            expect(result[2].type).toBe('text');

            const italicLink = result[3];
            expect(italicLink.type).toBe('italic');
            expect(italicLink.children[0].type).toBe('internal_link');
            expect(italicLink.children[0].title).toBe('wiki');

            expect(result[5]).toEqual({ type: 'heading', level: 3, content: 'Features' });

            let foundRef = false;
            for (const node of result) {
                if (node.type === 'xml_tag' && node.name === 'ref') {
                    foundRef = true;
                    expect(node.attrs).toEqual([
                        { key: 'name', value: 'docs' },
                        { key: 'group', value: 'note' }
                    ]);
                    expect(node.children[0].type).toBe('template');
                    expect(node.children[0].name).toBe('cite web');
                }
            }
            expect(foundRef).toBe(true);
        });
    });
});
